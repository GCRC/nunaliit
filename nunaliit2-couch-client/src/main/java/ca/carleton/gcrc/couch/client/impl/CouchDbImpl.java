package ca.carleton.gcrc.couch.client.impl;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDbSecurityDocument;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchDocumentOptions;

public class CouchDbImpl implements CouchDb {

	private CouchClient client;
	private URL url;
	private CouchDbChangeMonitorImpl changeMonitor;
	
	
	public CouchDbImpl(CouchClient client, URL url) {
		this.client = client;
		this.url = url;
	}

	@Override
	public CouchContext getContext() {
		return client.getContext();
	}
	
	@Override
	public CouchClient getClient() {
		return client;
	}

	@Override
	synchronized public CouchDbChangeMonitor getChangeMonitor() throws Exception {
		if( null == changeMonitor ){
			changeMonitor = new CouchDbChangeMonitorImpl(this);
		}
		return changeMonitor;
	}

	@Override
	public URL getUrl() {
		return url;
	}

	@Override
	public Collection<String> getAllDocIds() throws Exception {
		URL requestUrl = new URL(url, "_all_docs?include_docs=false");
		JSONObject response = ConnectionUtils.getJsonResource(getContext(), requestUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while fetching all doc ids: ");
		
		List<String> result = new Vector<String>();
		
		try {
			JSONArray rows = response.getJSONArray("rows");
			for(int loop=0,e=rows.length(); loop<e; ++loop){
				JSONObject row = rows.getJSONObject(loop);
				String docId = row.getString("id");
				result.add(docId);
			}
			
		} catch(Exception e) {
			throw new Exception("Error while interpreting the _all_docs response",e);
		}

		return result;
	}

	@Override
	public JSONObject createDocument(JSONObject doc) throws Exception {
		// Figure out id. Either one is provided, or one must be obtained
		String uuid = null;
		if( doc.has("_id") ) {
			Object id = doc.get("_id");
			if( null != id && id instanceof String ) {
				uuid = (String)id;
			} 
		}
		if( null == uuid ){
			uuid = client.getUuid();
			doc.put("_id", uuid);
		}
		
		// Compute document URL
		URL effectiveUrl = new URL(url, URLEncoder.encode(uuid, "UTF-8"));
		
		// Put document
		JSONObject response = ConnectionUtils.putJsonResource(getContext(), effectiveUrl, doc);
		
		ConnectionUtils.captureReponseErrors(response, "Error while creating document: ");
		
		// Parse response
		String id = null;
		String revision = null;
		try {
			id = response.getString("id");
			revision = response.getString("rev");
		} catch(Exception e) {
			throw new Exception("Error parsing create document response",e);
		}
		
		doc.put("_id", id);
		doc.put("_rev", revision);
		
		return response;
	}

	@Override
	public boolean documentExists(String docId) throws Exception {
		// Compute URL
		List<UrlParameter> parameters = new ArrayList<UrlParameter>(3);
		parameters.add( new UrlParameter("include_docs","false") );
		parameters.add( new UrlParameter("startkey","\""+docId+"\"") );
		parameters.add( new UrlParameter("endkey","\""+docId+"\"") );
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameters(new URL(url, "_all_docs"), parameters);
		
		JSONObject response = ConnectionUtils.getJsonResource(client.getContext(), effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while testing document existence for "+docId+": ");
		
		// Parse response
		boolean exists = false;
		try {
			JSONArray rows = response.getJSONArray("rows");
			if( rows.length() > 0 ) {
				exists = true;
			}
			
		} catch(Exception e) {
			throw new Exception("Error parsing document existence for: "+docId, e);
		}
		
		return exists;
	}

	@Override
	public boolean documentExists(JSONObject doc) throws Exception {
		// Fetch document id
		String docId = null;
		try {
			docId = doc.getString("_id");
		} catch(Exception e) {
			throw new Exception("Unable to find document id to verify existence", e);
		}
		
		return documentExists(docId);
	}

	@Override
	public JSONObject getDocument(String docId) throws Exception {
		URL docUrl = new URL(url, URLEncoder.encode(docId,"UTF-8"));
		JSONObject doc = ConnectionUtils.getJsonResource(getContext(), docUrl);
		
		ConnectionUtils.captureReponseErrors(doc, "Error while fetching document "+docId+": ");

		return doc;
	}

	@Override
	public JSONObject getDocument(String docId, CouchDocumentOptions options) throws Exception {
		// Compute URL
		URL effectiveUrl = null;
		{
			URL docUrl = new URL(url, URLEncoder.encode(docId,"UTF-8"));
	
			List<UrlParameter> parameters = new ArrayList<UrlParameter>(8);
	
			if( null != options ) {
				if( null != options.getRevision() ){
					parameters.add( new UrlParameter("rev",options.getRevision()) );
				}
				if( options.isRevsInfo() ){
					parameters.add( new UrlParameter("revs_info","true") );
				}
				if( options.isRevisions() ){
					parameters.add( new UrlParameter("revs","true") );
				}
				if( options.isConflicts() ){
					parameters.add( new UrlParameter("conflicts","true") );
				}
				if( options.isDeletedConflicts() ){
					parameters.add( new UrlParameter("deleted_conflicts","true") );
				}
			}
			
			effectiveUrl = ConnectionUtils.computeUrlWithParameters(docUrl, parameters);
		}
		
		JSONObject doc = ConnectionUtils.getJsonResource(getContext(), effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(doc, "Error while fetching document "+docId+": ");

		return doc;
	}


	@Override
	public String getDocumentRevision(String docId) throws Exception {
		// Compute URL
		List<UrlParameter> parameters = new ArrayList<UrlParameter>(3);
		parameters.add( new UrlParameter("include_docs","false") );
		parameters.add( new UrlParameter("startkey","\""+docId+"\"") );
		parameters.add( new UrlParameter("endkey","\""+docId+"\"") );
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameters(new URL(url, "_all_docs"), parameters);
		
		JSONObject response = ConnectionUtils.getJsonResource(getContext(), effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while fetching revision for "+docId+": ");
		
		// Parse response
		String revision = null;
		try {
			JSONArray rows = response.getJSONArray("rows");
			JSONObject row = rows.getJSONObject(0);
			JSONObject doc = row.getJSONObject("value");
			revision = doc.getString("rev");
			
		} catch(Exception e) {
			throw new Exception("Error parsing document revision for: "+docId, e);
		}
		
		return revision;
	}

	@Override
	public String getDocumentRevision(JSONObject doc) throws Exception {
		// Fetch document id
		String docId = null;
		try {
			docId = doc.getString("_id");
		} catch(Exception e) {
			throw new Exception("Unable to find document id to fetch revision", e);
		}
		
		return getDocumentRevision(docId);
	}

	@Override
	public Collection<JSONObject> getDocuments(List<String> docIds) throws Exception {
		return getDocuments(docIds, null);
	}

	@Override
	public Collection<JSONObject> getDocuments(List<String> docIds, CouchDocumentOptions options) throws Exception {
		URL effectiveUrl = null;
		{
			URL requestUrl = new URL(url, "_all_docs");
			List<UrlParameter> parameters = new ArrayList<UrlParameter>(10);
	
			{
				UrlParameter parameter = new UrlParameter("include_docs","true");
				parameters.add(parameter);
			}
			
			if( null != docIds && docIds.size() > 0 ){
				JSONArray docIdsArray = new JSONArray(); 
				for(String docId : docIds){
					docIdsArray.put(docId);
				}
				
				UrlParameter parameter = new UrlParameter("keys",docIdsArray.toString());
				parameters.add(parameter);
			}
			
			if( null != options ) {
				if( options.isRevsInfo() ){
					parameters.add( new UrlParameter("revs_info","true") );
				}
				if( options.isRevisions() ){
					parameters.add( new UrlParameter("revs","true") );
				}
				if( options.isConflicts() ){
					parameters.add( new UrlParameter("conflicts","true") );
				}
				if( options.isDeletedConflicts() ){
					parameters.add( new UrlParameter("deleted_conflicts","true") );
				}
			}
			
			effectiveUrl = ConnectionUtils.computeUrlWithParameters(
					requestUrl
					,parameters
					);
		}

		JSONObject response = ConnectionUtils.getJsonResource(getContext(), effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while fetching all doc ids: ");
		
		List<JSONObject> result = new Vector<JSONObject>();
		
		try {
			JSONArray rows = response.getJSONArray("rows");
			for(int loop=0,e=rows.length(); loop<e; ++loop){
				JSONObject row = rows.getJSONObject(loop);
				JSONObject doc = row.optJSONObject("doc");
				if( null != doc ) {
					result.add(doc);
				}
			}
			
		} catch(Exception e) {
			throw new Exception("Error while interpreting the _all_docs response",e);
		}

		return result;
	}

	@Override
	public void updateDocument(JSONObject doc) throws Exception {
		// Fetch document id
		String docId = null;
		try {
			docId = doc.getString("_id");
		} catch(Exception e) {
			throw new Exception("Unable to find document id during update", e);
		}
		
		// Compute URL
		URL effectiveUrl = new URL(url, URLEncoder.encode(docId,"UTF-8"));
		
		// Update
		JSONObject response = ConnectionUtils.putJsonResource(getContext(), effectiveUrl, doc);
		
		ConnectionUtils.captureReponseErrors(response, "Error while updating "+docId+": ");
		
		// Parse response
		String revision = null;
		try {
			revision = response.getString("rev");
			
		} catch(Exception e) {
			throw new Exception("Error parsing revision during update: "+docId, e);
		}
		
		doc.put("_rev", revision);
	}

	@Override
	public void deleteDocument(JSONObject doc) throws Exception {
		// Fetch document id
		String docId = null;
		String revision = null;
		try {
			docId = doc.getString("_id");
			revision = doc.getString("_rev");
		} catch(Exception e) {
			throw new Exception("Unable to find document id or revision during delete", e);
		}
		
		// Compute URL
		UrlParameter parameter = new UrlParameter("rev",revision);
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameter(
				new URL(url, URLEncoder.encode(docId,"UTF-8"))
				,parameter
				);
		
		// DELETE
		JSONObject response = ConnectionUtils.deleteJsonResource(getContext(), effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while deleting "+docId+": ");
	}

	@Override
	public CouchDesignDocument getDesignDocument(String ddName) throws Exception {
		URL effectiveUrl = new URL(url, "_design/"+URLEncoder.encode(ddName,"UTF-8")+"/");
		CouchDesignDocumentImpl dd = new CouchDesignDocumentImpl(this,effectiveUrl);
		
		return dd;
	}

	@Override
	public void uploadAttachment(
		JSONObject doc
		,String name
		,File file
		,String contentType
		) throws Exception {
		
		try (FileInputStream fis = new FileInputStream(file) ) {
			long size = file.length();
			
			uploadAttachment(doc, name, fis, contentType, size);					
		} catch (Exception e) {
			throw e;
		}
	}

	@Override
	public JSONObject uploadAttachment(
			JSONObject doc
			,String name
			,InputStream is
			,String contentType
			,long size
			) throws Exception {

		String docId = doc.optString("_id", null);
		String path = URLEncoder.encode(docId,"UTF-8")
			+ "/"
			+ URLEncoder.encode(name,"UTF-8");
		URL attachmentUrl = new URL(url, path);
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameter(attachmentUrl, new UrlParameter("rev",doc.optString("_rev")));
		
		// PUT
		JSONObject response = ConnectionUtils.putStreamResource(
			getContext()
			,effectiveUrl
			,is
			,contentType
			,size
			);
		
		ConnectionUtils.captureReponseErrors(response, "Error while uploading attachment to "+docId+": ");
		
		// DO NOT UPDATE DOCUMENT REVISION. If the document gets submitted
		// again without being refreshed, then it would not include the new attachment, which
		// would instruct the server to delete it. Better have revision wrong and forcing caller
		// to refresh document.
		
		return response;
	}

	@Override
	public String downloadAttachment(
			JSONObject doc
			,String name
			,OutputStream os
			) throws Exception {

		String docId = doc.optString("_id", null);
		
		return downloadAttachment(docId, name, os);
	}

	@Override
	public String downloadAttachment(
			String docId
			,String name
			,OutputStream os
			) throws Exception {

		String path = URLEncoder.encode(docId,"UTF-8")
			+ "/"
			+ URLEncoder.encode(name,"UTF-8");
		URL attachmentUrl = new URL(url, path);
		
		// GET
		String contentType = ConnectionUtils.getStreamResource(
			getContext()
			,attachmentUrl
			,os
			);
		
		return contentType;
	}

	@Override
	public JSONObject deleteAttachment(JSONObject doc, String name) throws Exception {
		String docId = doc.optString("_id", null);
		String path = URLEncoder.encode(docId,"UTF-8")
			+ "/"
			+ URLEncoder.encode(name,"UTF-8");
		URL attachmentUrl = new URL(url, path);
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameter(attachmentUrl, new UrlParameter("rev",doc.optString("_rev")));
		
		// DELETE
		JSONObject response = ConnectionUtils.deleteJsonResource(getContext(), effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while deleting attachment "+name+" from "+docId+": ");

		return response;
	}

	@Override
	public CouchDbSecurityDocument getSecurityDocument() throws Exception {
		URL securityUrl = new URL(url, "_security");

		JSONObject response = ConnectionUtils.getJsonResource(getContext(), securityUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while fetching security document: ");

		CouchDbSecurityDocumentImpl security = new CouchDbSecurityDocumentImpl(response);
		
		return security;
	}

	@Override
	public void setSecurityDocument(CouchDbSecurityDocument security) throws Exception {
		URL securityUrl = new URL(url, "_security");

		JSONObject jsonSecurity = security.getJSON();
		if( null == jsonSecurity ){
			jsonSecurity = new JSONObject();
		}
		
		// Put document
		JSONObject response = ConnectionUtils.putJsonResource(getContext(), securityUrl, jsonSecurity);
		
		ConnectionUtils.captureReponseErrors(response, "Error while updating security document: ");
	}
}
