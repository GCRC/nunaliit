package ca.carleton.gcrc.couch.submission;

import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchDocumentOptions;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchServerVersion;
import ca.carleton.gcrc.couch.client.impl.ConnectionStreamResult;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.json.JSONSupport;
import org.json.JSONObject;

public class SubmissionServletActions {
	
	static private Pattern underscorePattern = Pattern.compile("_(.*)");

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

//	private String atlasName = null;
	private CouchDesignDocument submissionDesign = null;
	private CouchDb documentCouchDb = null;
	private JSONObject cached_welcome;

	public SubmissionServletActions(
			String atlasName
			,CouchDesignDocument submissionDesign
			,CouchDb documentCouchDb
		){
//		this.atlasName = atlasName;
		this.submissionDesign = submissionDesign;
		this.documentCouchDb = documentCouchDb;
	}
	
	synchronized public JSONObject getWelcome() throws Exception{
		if( null == cached_welcome ){
			cached_welcome = new JSONObject();
			cached_welcome.put("SubmissionServlet", true);
			
			if( null != submissionDesign ){
				cached_welcome.put("submissionDbAvailable", true);
			} else {
				cached_welcome.put("submissionDbAvailable", false);
			}
			
			CouchServerVersion version = submissionDesign.getDatabase().getClient().getVersion();
			cached_welcome.put("version", version.getFullVersion());
		}
		
		return cached_welcome;
	}

	public JSONObject getUuids(CouchAuthenticationContext authContext, int count) throws Exception {
		try {
			String[] uuids = submissionDesign.getDatabase().getClient().getUuids(count);
			
			JSONObject result = new JSONObject();
			
			JSONArray jsonUuids = new JSONArray();
			for(int loop=0; loop<uuids.length; ++loop){
				jsonUuids.put(uuids[loop]);
			}
			result.put("uuids", jsonUuids);
			
			return result;
			
		} catch (Exception e) {
			throw new Exception("Error while obtaining uuids",e);
		}
	}

	public JSONObject modifyDocument(
			CouchAuthenticationContext authContext 
			,String dbIdentifier 
			,String deviceId 
			,String docId 
			,JSONObject doc
			) throws Exception {
		
		if( "submissionDb".equals(dbIdentifier) ) {
			if( null == doc ){
				throw new Exception("Invalid document content (null)");
			}
			
			// Verify that if a _id attribute is provided in the document, that it matches the
			// one given in parameter
			if( JSONSupport.containsKey(doc, "_id") ){
				String id = doc.getString("_id");
				if( false == id.equals(docId) ){
					throw new Exception("Document identifier found in content must match the one found in parameters");
				}
			};
			
			validateLastUpdated(authContext, doc);
			
			JSONObject originalDoc = null;
			if( JSONSupport.containsKey(doc, "_rev") ){
				CouchDocumentOptions options = new CouchDocumentOptions();
				options.setRevision( doc.getString("_rev") );
				originalDoc = documentCouchDb.getDocument(docId, options);
			}
			
			JSONObject submissionRequest = buildSubmissionRequest(authContext, deviceId, doc, originalDoc);
			
			JSONObject result = submissionDesign.getDatabase().createDocument(submissionRequest);
			
			return result;

		} else {
			throw new Exception("Only operations against 'submissionDb' are accepted");
		}
	}

	public JSONObject deleteDocument(
			CouchAuthenticationContext authContext 
			,String dbIdentifier 
			,String deviceId
			,String docId 
			,String rev
			) throws Exception {
		
		if( "submissionDb".equals(dbIdentifier) ) {
			if( null == docId || null == rev ){
				throw new Exception("Document identifier and revision must be specified");
			}
			
			JSONObject originalDoc = null;
			{
				CouchDocumentOptions options = new CouchDocumentOptions();
				options.setRevision( rev );
				originalDoc = documentCouchDb.getDocument(docId, options);
			}
			
			JSONObject submissionRequest = buildSubmissionRequest(authContext, deviceId, null, originalDoc);
			
			JSONObject result = submissionDesign.getDatabase().createDocument(submissionRequest);
			
			return result;

		} else {
			throw new Exception("Only operations against 'submissionDb' are accepted");
		}
	}

	public ConnectionStreamResult getSubmissionInfoBySubmissionId(
			CouchAuthenticationContext authContext 
			,String submissionId 
			) throws Exception {
		
		try {
			CouchQuery query = new CouchQuery();
			query.setViewName("submission-info-by-id");
			query.setStartKey(submissionId);
			query.setEndKey(submissionId);

			ConnectionStreamResult results = submissionDesign.performQueryRaw(query);
			return results;

		} catch (Exception e) {
			throw new Exception("Error while accessing submission info by submission id view", e);
		}
	}

	public ConnectionStreamResult getSubmissionInfoByDeviceId(
			CouchAuthenticationContext authContext 
			,String deviceId 
			) throws Exception {
		
		try {
			CouchQuery query = new CouchQuery();
			query.setViewName("submission-info-by-device-id");
			query.setStartKey(deviceId);
			query.setEndKey(deviceId);

			ConnectionStreamResult results = submissionDesign.performQueryRaw(query);
			return results;

		} catch (Exception e) {
			throw new Exception("Error while accessing submission info by device id view", e);
		}
	}

	private void validateLastUpdated(CouchAuthenticationContext authContext, JSONObject doc) throws Exception{
		JSONObject lastUpdated = doc.optJSONObject("nunaliit_last_updated");
		if( null == lastUpdated ){
			throw new Exception("Document does not contain a 'nunaliit_last_updated' field");
		}
		
		String userId = lastUpdated.optString("name");
		if( null == userId ){
			throw new Exception("Document contains a 'nunaliit_last_updated' structure with a missing 'name' field");
		}
		
		if( false == userId.equals(authContext.getName()) ){
			throw new Exception("Identifier found in the 'nunaliit_last_updated' does not match authenticated user");
		}
	}

	private JSONObject buildSubmissionRequest(
			CouchAuthenticationContext authContext
			,String deviceId
			,JSONObject doc
			,JSONObject original
			) throws Exception{
		JSONObject submissionRequest = new JSONObject();
		
		submissionRequest.put("nunaliit_type", "document_submission");
		
		JSONObject submissionStructure = new JSONObject();
		submissionRequest.put("nunaliit_submission", submissionStructure);
		submissionStructure.put("state", "submitted");
		
		// Device Identifier
		if( null != deviceId ){
			submissionStructure.put("deviceId", deviceId);
		}
		
		// Submitter
		{
			submissionStructure.put("submitter_name", authContext.getName());
			JSONArray roles = new JSONArray();
			for(String role : authContext.getRoles()){
				roles.put(role);
			}
			submissionStructure.put("submitter_roles", roles);
		}
		
		// Submitted
		if( null != doc ){
			JSONObject submittedDoc = new JSONObject();
			submissionStructure.put("submitted_doc", submittedDoc);
			JSONObject submittedReserved = new JSONObject();
			submissionStructure.put("submitted_reserved", submittedReserved);
			
			Iterator<?> it = doc.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = doc.get(key);
					
					Matcher matcher = underscorePattern.matcher(key);
					if( matcher.matches() ){
						String reservedKey = matcher.group(1);
						submittedReserved.put(reservedKey, value);
					} else {
						submittedDoc.put(key, value);
					}
				}
			}
		} else {
			submissionStructure.put("deletion", true);
		}
		
		// Original
		if( null != original ){
			JSONObject originalDoc = new JSONObject();
			submissionStructure.put("original_doc", originalDoc);
			JSONObject originalReserved = new JSONObject();
			submissionStructure.put("original_reserved", originalReserved);
			
			Iterator<?> it = original.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = original.get(key);
					
					Matcher matcher = underscorePattern.matcher(key);
					if( matcher.matches() ){
						String reservedKey = matcher.group(1);
						originalReserved.put(reservedKey, value);
					} else {
						originalDoc.put(key, value);
					}
				}
			}
		}
		
		CouchNunaliitUtils.adjustDocumentForStorage(submissionRequest, authContext);
		
		return submissionRequest;
	}
}
