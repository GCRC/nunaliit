package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.utils.StreamUtils;

public class MockFileConversionContext2 implements FileConversionContext {

	private JSONObject doc;
	private List<MockUploadedFile> uploadedFiles = new Vector<MockUploadedFile>();
	private Map<String,File> availableDownloads = new HashMap<String,File>();
	private List<JSONObject> savedDocuments = new Vector<JSONObject>();
	private List<JSONObject> createdDocuments = new Vector<JSONObject>();

	public MockFileConversionContext2(
		JSONObject doc
		) throws Exception {
		this.doc = doc;
	}

	@Override
	public DocumentDescriptor getDocument() {
		return new DocumentDescriptor(this);
	}
	
	@Override
	public JSONObject getDoc() throws Exception {
		return doc;
	}

	@Override
	public void saveDocument() throws Exception {
		JSONObject clone = JSONSupport.copyObject(doc);
		savedDocuments.add(clone);
	}
	
	public List<JSONObject> getSavedDocuments() {
		return savedDocuments;
	}
	
	public JSONObject getSavedDocument() {
		JSONObject savedDocument = null;
		
		if( savedDocuments.size() > 0 ){
			savedDocument = savedDocuments.get( savedDocuments.size() - 1 );
		}
		
		return savedDocument;
	}

	@Override
	public void createDocument(JSONObject doc) throws Exception {
		JSONObject clone = JSONSupport.copyObject(doc);
		createdDocuments.add(clone);
	}

	public List<JSONObject> getCreatedDocuments() {
		return createdDocuments;
	}

	@Override
	public void uploadFile(String attachmentName, File uploadedFile, String mimeType) throws Exception {
		
		MockUploadedFile uploaded = new MockUploadedFile();
		uploaded.setAttachmentName(attachmentName);
		uploaded.setUploadedFile(uploadedFile);
		uploaded.setMimeType(mimeType);
		
		uploadedFiles.add(uploaded);
	}
	
	public List<MockUploadedFile> getUploadedFiles() {
		return uploadedFiles;
	}
	
	public void addAvailableDownload(String attachmentName, File file) {
		availableDownloads.put(attachmentName, file);
	}

	@Override
	public void downloadFile(String attachmentName, File outputFile) throws Exception {

		File availableFile = availableDownloads.get(attachmentName);
		if( null == availableFile ){
			throw new Exception("Attachment not available: "+attachmentName);
		}

		FileInputStream fis = null;
		FileOutputStream fos = null;
		try {
			fis = new FileInputStream(availableFile);
			fos = new FileOutputStream(outputFile);
			
			StreamUtils.copyStream(fis, fos);
			
			fos.flush();
			fos.close();
			fos = null;

			fis.close();
			fis = null;

		} catch (Exception e) {
			throw new Exception("Error while copying file", e);

		} finally {
			if( null != fos ){
				try {
					fos.close();
				} catch(Exception e) {
					// Ignore
				}
			}

			if( null != fis ){
				try {
					fis.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
	}

	@Override
	public File getMediaFileFromName(String fileName) {
		return null;
	}

	@Override
	public CouchAuthenticationContext getUserFromName(String userName) throws Exception {
		return new MockAuthenticationContext();
	}
}
