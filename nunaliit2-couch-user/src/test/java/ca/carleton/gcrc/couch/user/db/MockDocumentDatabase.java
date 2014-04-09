package ca.carleton.gcrc.couch.user.db;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbSecurityDocument;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchDocumentOptions;

public class MockDocumentDatabase implements CouchDb {

	private Map<String,JSONObject> docsById = new HashMap<String,JSONObject>();
	
	@Override
	public CouchContext getContext() {
		return null;
	}

	@Override
	public CouchClient getClient() {
		return null;
	}

	@Override
	public URL getUrl() {
		return null;
	}

	@Override
	public Collection<String> getAllDocIds() throws Exception {
		List<String> result = new Vector<String>();
		result.addAll( docsById.keySet() );
		return result;
	}

	@Override
	public JSONObject createDocument(JSONObject doc) throws Exception {
		String docId = doc.getString("_id");
		
		docsById.put(docId, doc);
		increaseVersion(doc);
		
		return doc;
	}

	@Override
	public boolean documentExists(String docId) throws Exception {
		return docsById.containsKey(docId);
	}

	@Override
	public boolean documentExists(JSONObject doc) throws Exception {
		String docId = doc.getString("_id");
		return docsById.containsKey(docId);
	}

	@Override
	public JSONObject getDocument(String docId) throws Exception {
		JSONObject doc = docsById.get(docId);
		if( null == doc ){
			throw new Exception("Document not found");
		}
		return doc;
	}

	@Override
	public JSONObject getDocument(String docId, CouchDocumentOptions options) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public Collection<JSONObject> getDocuments(List<String> docIds) throws Exception {
		List<JSONObject> docs = new ArrayList<JSONObject>(docIds.size());
		for(String docId : docIds){
			JSONObject doc = docsById.get(docId);
			if( null != doc ){
				docs.add(doc);
			}
		}
		return docs;
	}

	@Override
	public Collection<JSONObject> getDocuments(
			List<String> docIds,
			CouchDocumentOptions options) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public String getDocumentRevision(String docId) throws Exception {
		JSONObject doc = docsById.get(docId);
		if( null == doc ){
			throw new Exception("Document not found");
		}
		return doc.getString("_rev");
	}

	@Override
	public String getDocumentRevision(JSONObject doc) throws Exception {
		String docId = doc.getString("_id");
		JSONObject dbDoc = docsById.get(docId);
		if( null == dbDoc ){
			throw new Exception("Document not found");
		}
		return dbDoc.getString("_rev");
	}

	@Override
	public void updateDocument(JSONObject doc) throws Exception {
		String docId = doc.getString("_id");
		
		JSONObject currentDoc = docsById.get(docId);
		if( null == currentDoc ){
			throw new Exception("Document not found");
		}
		
		String currentRev = currentDoc.getString("_rev");
		if( false == currentRev.equals(doc.get("_rev")) ){
			throw new Exception("Revision mis-match");
		}

		// Replace
		docsById.put(docId, doc);
		
		// Update revision
		increaseVersion(doc);
	}

	@Override
	public void deleteDocument(JSONObject doc) throws Exception {
		String docId = doc.getString("_id");
		
		JSONObject currentDoc = docsById.get(docId);
		if( null == currentDoc ){
			throw new Exception("Document not found");
		}
		
		String currentRev = currentDoc.getString("_rev");
		if( false == currentRev.equals(doc.get("_rev")) ){
			throw new Exception("Revision mis-match");
		}

		// Replace
		docsById.remove(docId);
	}

	@Override
	public void uploadAttachment(
			JSONObject doc, 
			String name, 
			File file,
			String contentType) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public JSONObject uploadAttachment(
			JSONObject doc, 
			String name,
			InputStream is, 
			String contentType, 
			long size) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public String downloadAttachment(
			JSONObject doc, 
			String name, 
			OutputStream os) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public JSONObject deleteAttachment(JSONObject doc, String name) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public CouchDesignDocument getDesignDocument(String ddName) throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public CouchDbSecurityDocument getSecurityDocument() throws Exception {
		throw new Exception("Not implemented");
	}

	@Override
	public void setSecurityDocument(CouchDbSecurityDocument security) throws Exception {
		throw new Exception("Not implemented");
	}

	private void increaseVersion(JSONObject doc) throws Exception {
		String currentRev = doc.optString("_rev","0-abcde");
		String[] components = currentRev.split("-");
		int version = Integer.parseInt( components[0] );
		int nextVersion = version + 1;
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		OutputStreamWriter osw = new OutputStreamWriter(baos,"UTF-8");
		osw.write(doc.optString("_id",""));
		osw.write(""+nextVersion);
		osw.flush();

		MessageDigest md = MessageDigest.getInstance("SHA-1");
		byte[] digest = md.digest(baos.toByteArray());
		
		StringWriter sw = new StringWriter();
		sw.write(""+nextVersion);
		sw.write("-");
		for(byte b : digest){
			String hex = String.format("%1$02x", b);
			sw.write(hex);
		}
		sw.flush();
		
		doc.put("_rev", sw.toString());
	}
}
