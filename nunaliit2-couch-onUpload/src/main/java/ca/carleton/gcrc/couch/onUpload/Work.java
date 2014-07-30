package ca.carleton.gcrc.couch.onUpload;

import java.io.File;

import org.json.JSONObject;

public interface Work {

	String getState();
	String getDocId();
	String getAttachmentName();
	String getUploadId();
	String getUploadRequestDocId();
	
	JSONObject getDocument() throws Exception;
	void saveDocument() throws Exception;
	void uploadAttachment(String attachmentName, File uploadedFile, String mimeType) throws Exception;
}
