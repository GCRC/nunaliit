package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;
import java.io.FileOutputStream;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import ca.carleton.gcrc.json.JSONSupport;

public class FileConversionContext {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private JSONObject doc;
	private CouchDesignDocument dd;
	private String attachmentName;
	private File mediaDir;
	private boolean isSavingRequired = false;

	public FileConversionContext(
		JSONObject doc
		,CouchDesignDocument dd
		,String attachmentName
		,File mediaDir
		) {
		this.doc = doc;
		this.dd = dd;
		this.attachmentName = attachmentName;
		this.mediaDir = mediaDir;
	}
	
	public String getId() {
		return doc.optString("_id");
	}

	public JSONObject getDoc() {
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

	public String getAttachmentName() {
		return attachmentName;
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

	public boolean isAttachmentDescriptionAvailable() {
		return isAttachmentDescriptionAvailable(attachmentName);
	}

	public boolean isAttachmentDescriptionAvailable(String attName) {
		JSONObject attachments = doc.optJSONObject("nunaliit_attachments");
		if( null == attachments ) {
			return false;
		}

		JSONObject files = attachments.optJSONObject("files");
		if( null == files ) {
			return false;
		}
		
		JSONObject attachmentDescription = files.optJSONObject(attName);
		if( null == attachmentDescription ) {
			return false;
		}
		
		return true;
	}

	public AttachmentDescriptor getAttachmentDescription() throws Exception {
		return getAttachmentDescription(attachmentName);
	}
	
	public AttachmentDescriptor getAttachmentDescription(String attName) throws Exception {
		
		JSONObject attachments = doc.optJSONObject("nunaliit_attachments");
		if( null == attachments ) {
			attachments = new JSONObject();
			doc.put("nunaliit_attachments",attachments);
		}

		JSONObject files = attachments.optJSONObject("files");
		if( null == files ) {
			files = new JSONObject();
			attachments.put("files",files);
		}

		JSONObject attachmentDescription = files.optJSONObject(attName);
		if( null == attachmentDescription ) {
			attachmentDescription = new JSONObject();
			attachmentDescription.put("attachmentName", attName);
			files.put(attName, attachmentDescription);
		}
		
		return new AttachmentDescriptor(this, attName);
	}
	
	public CreateUpdateInfo getCreatedObject() throws Exception {
		CreateUpdateInfo result = null;
		
		if( JSONSupport.containsKey(doc, CouchNunaliitConstants.DOC_KEY_CREATED) ) {
			result = new CreateUpdateInfo(this, CouchNunaliitConstants.DOC_KEY_CREATED);
		}
		
		return result;
	}
	
	public CreateUpdateInfo getLastUpdatedObject() throws Exception {
		CreateUpdateInfo result = null;
		
		if( JSONSupport.containsKey(doc, CouchNunaliitConstants.DOC_KEY_LAST_UPDATED) ) {
			result = new CreateUpdateInfo(this, CouchNunaliitConstants.DOC_KEY_LAST_UPDATED);
		}
		
		return result;
	}

	public void saveDocument() throws Exception {
		String docId = getId();
		dd.getDatabase().updateDocument(doc);
		isSavingRequired = false;
		doc = dd.getDatabase().getDocument(docId);
	}
	
	public boolean isFilePresent(String name) throws Exception {
		if( null == doc ) return false;
		
		JSONObject _att = doc.optJSONObject("_attachments");
		if( null == _att ) return false;
		
		return JSONSupport.containsKey(_att, name);
	}
	
	public void removeFile(String name) throws Exception {
		if( null == doc ) return;
		
		JSONObject _att = doc.optJSONObject("_attachments");
		if( null == _att ) return;
		
		if( JSONSupport.containsKey(_att, name) ) {
			_att.remove(name);
		}
		
		setSavingRequired(true);
	}

	public JSONObject uploadFile(String attachmentName, File uploadedFile, String mimeType) throws Exception {
		String docId = getId();
		
		if( isSavingRequired ) {
			saveDocument();
		}

		dd.getDatabase().uploadAttachment(
			doc
			,attachmentName
			,uploadedFile
			,mimeType
			);
		
		// Refresh doc
		doc = dd.getDatabase().getDocument(docId);
		isSavingRequired = false;
		
		return doc;
	}

	public File downloadFile(File outputFile) throws Exception {

		FileOutputStream fos = new FileOutputStream(outputFile);
		
		dd.getDatabase().downloadAttachment(
			doc
			,attachmentName
			,fos
			);
		
		fos.close();
		
		return outputFile;
	}
}
