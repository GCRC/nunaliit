package ca.carleton.gcrc.couch.client;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.Collection;
import java.util.List;

import org.json.JSONObject;

public interface CouchDb {

	CouchContext getContext();
	
	CouchClient getClient();
	
	CouchDbChangeMonitor getChangeMonitor() throws Exception;
	
	URL getUrl();
	
	Collection<String> getAllDocIds() throws Exception;
	
	JSONObject createDocument(JSONObject doc) throws Exception;
	
	boolean documentExists(String docId) throws Exception;
	
	boolean documentExists(JSONObject doc) throws Exception;
	
	JSONObject getDocument(String docId) throws Exception;
	
	JSONObject getDocument(String docId, CouchDocumentOptions options) throws Exception;

	Collection<JSONObject> getDocuments(List<String> docIds) throws Exception;

	Collection<JSONObject> getDocuments(List<String> docIds, CouchDocumentOptions options) throws Exception;
	
	String getDocumentRevision(String docId) throws Exception;
	
	String getDocumentRevision(JSONObject doc) throws Exception;
	
	void updateDocument(JSONObject doc) throws Exception;
	
	void deleteDocument(JSONObject doc) throws Exception;
	
	void uploadAttachment(JSONObject doc, String name, File file, String contentType) throws Exception;
	
	JSONObject uploadAttachment(JSONObject doc, String name, InputStream is, String contentType, long size) throws Exception;
	
	String downloadAttachment(JSONObject doc, String name, OutputStream os) throws Exception;
	
	JSONObject deleteAttachment(JSONObject doc, String name) throws Exception;
	
	CouchDesignDocument getDesignDocument(String ddName) throws Exception;
	
	CouchDbSecurityDocument getSecurityDocument() throws Exception;
	
	void setSecurityDocument(CouchDbSecurityDocument security) throws Exception;
}
