package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.io.FileOutputStream;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;

public class MockFileConversionContext implements FileConversionContext {

	private JSONObject doc;
	private CouchDesignDocument dd;
	private File mediaDir;
	private boolean isSavingRequired = false;

	public MockFileConversionContext(
		JSONObject doc
		,CouchDesignDocument dd
		,File mediaDir
		) throws Exception {
		this.doc = doc;
		this.dd = dd;
		this.mediaDir = mediaDir;
	}

	@Override
	public DocumentDescriptor getDocument() {
		return new DocumentDescriptor(this);
	}
	
	public JSONObject getDoc() throws Exception {
		return doc;
	}

	public CouchDesignDocument getDesignDocument() {
		return dd;
	}

	public CouchDb getDatabase() {
		return dd.getDatabase();
	}

	public CouchClient getClient() {
		return dd.getDatabase().getClient();
	}

	public File getMediaDir() {
		return mediaDir;
	}
	
	public boolean isSavingRequired() {
		return isSavingRequired;
	}

	public void setSavingRequired(boolean isSavingRequired) {
		this.isSavingRequired = isSavingRequired;
	}
	public void saveDocument() throws Exception {
		String docId = doc.getString("_id");
		dd.getDatabase().updateDocument(doc);
		doc = dd.getDatabase().getDocument(docId);
		isSavingRequired = false;
	}

	public void uploadFile(String attachmentName, File uploadedFile, String mimeType) throws Exception {
		
		if( isSavingRequired ) {
			saveDocument();
		}

		JSONObject doc = getDoc();
		dd.getDatabase().uploadAttachment(
			doc
			,attachmentName
			,uploadedFile
			,mimeType
			);
		
		// Refresh doc
		isSavingRequired = false;
	}

	public void downloadFile(String attachmentName, File outputFile) throws Exception {

		FileOutputStream fos = new FileOutputStream(outputFile);
		
		JSONObject doc = getDoc();
		dd.getDatabase().downloadAttachment(
			doc
			,attachmentName
			,fos
			);
		
		fos.close();
	}

	@Override
	public void createDocument(JSONObject doc) throws Exception {
		dd.getDatabase().createDocument(doc);
	}

	@Override
	public File getMediaFileFromName(String fileName) {
		return new File(mediaDir, fileName);
	}

	@Override
	public CouchAuthenticationContext getUserFromName(String userName) throws Exception {
		CouchUserDb userDb = getClient().getUserDatabase();
		return userDb.getUserFromName(userName);
	}
}
