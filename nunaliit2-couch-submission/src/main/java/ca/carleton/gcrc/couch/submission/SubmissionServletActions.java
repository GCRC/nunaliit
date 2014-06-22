package ca.carleton.gcrc.couch.submission;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchServerVersion;
import ca.carleton.gcrc.json.JSONSupport;

public class SubmissionServletActions {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

//	private String atlasName = null;
	private CouchDesignDocument submissionDesign = null;
	private JSONObject cached_welcome;

	public SubmissionServletActions(
			String atlasName
			,CouchDesignDocument submissionDesign
		){
//		this.atlasName = atlasName;
		this.submissionDesign = submissionDesign;
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
			
			// On creation, _rev attribute must not be set
			if( JSONSupport.containsKey(doc, "_rev") ){
				throw new Exception("Currently accepting only document creation");
			};
			
			validateLastUpdated(authContext, doc);
			
			JSONObject result = submissionDesign.getDatabase().createDocument(doc);
			
			return result;

		} else {
			throw new Exception("Only operations against 'submissionDb' are accepted");
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
}
