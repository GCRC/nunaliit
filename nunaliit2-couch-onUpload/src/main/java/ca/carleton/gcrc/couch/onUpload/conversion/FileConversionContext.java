package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;

public interface FileConversionContext {
	
	DocumentDescriptor getDocument();

	JSONObject getDoc() throws Exception;

	void saveDocument() throws Exception;
	
	void uploadFile(String attachmentName, File uploadedFile, String mimeType) throws Exception;

	void downloadFile(String attachmentName, File outputFile) throws Exception;
	
	void createDocument(JSONObject doc) throws Exception;
	
	File getMediaFileFromName(String fileName);
	
	CouchAuthenticationContext getUserFromName(String userName) throws Exception;
}
