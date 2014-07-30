package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;
import java.io.FileOutputStream;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.onUpload.Work;

public class FileConversionContextImpl implements FileConversionContext {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private Work work;
	private CouchDesignDocument dd;
	private File mediaDir;

	public FileConversionContextImpl(
		Work work
		,CouchDesignDocument dd
		,File mediaDir
		) throws Exception {
		this.work = work;
		this.dd = dd;
		this.mediaDir = mediaDir;
	}

	@Override
	public DocumentDescriptor getDocument() {
		return new DocumentDescriptor(this);
	}
	
	public JSONObject getDoc() throws Exception {
		return work.getDocument();
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

	public void saveDocument() throws Exception {
		work.saveDocument();
	}

	public void uploadFile(String attachmentName, File uploadedFile, String mimeType) throws Exception {
		work.uploadAttachment(attachmentName, uploadedFile, mimeType);
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
