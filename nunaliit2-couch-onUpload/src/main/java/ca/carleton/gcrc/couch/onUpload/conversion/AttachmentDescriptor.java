package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;

import org.json.JSONObject;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;

public class AttachmentDescriptor extends AbstractDescriptor {

	final protected Logger logger = Logger.getLogger(this.getClass());

	private FileConversionContext context;
	private String attachmentName;
	
	public AttachmentDescriptor(FileConversionContext context, String attachmentName){
		this.context = context;
		this.attachmentName = attachmentName;
	}
	
	protected JSONObject getJson() throws Exception {
		
		JSONObject doc = context.getDoc();
		JSONObject attachments = doc.getJSONObject("nunaliit_attachments");
		JSONObject files = attachments.getJSONObject("files");
		JSONObject attachmentDescription = files.getJSONObject(attachmentName);
		
		return attachmentDescription;
		
	}
	
	public String getStatus() throws Exception {
		return getStringAttribute(UploadConstants.UPLOAD_STATUS_KEY);
	}
	
	public void setStatus(String status) throws Exception {
		setStringAttribute(UploadConstants.UPLOAD_STATUS_KEY, status);
	}
	
	public String getAttachmentName() throws Exception {
		return getStringAttribute(UploadConstants.ATTACHMENT_NAME_KEY);
	}
	
	public void setAttachmentName(String attachmentName) throws Exception {
		setStringAttribute(UploadConstants.ATTACHMENT_NAME_KEY,attachmentName);
	}
	
	public String getFileClass() throws Exception {
		return getStringAttribute(UploadConstants.MIME_CLASS_KEY);
	}
	
	public void setFileClass(String fileClass) throws Exception {
		setStringAttribute(UploadConstants.MIME_CLASS_KEY,fileClass);
	}
	
	public String getContentType() throws Exception {
		return getStringAttribute(UploadConstants.MIME_KEY);
	}
	
	public void setContentType(String contentType) throws Exception {
		setStringAttribute(UploadConstants.MIME_KEY,contentType);
	}
	
	public String getEncodingType() throws Exception {
		return getStringAttribute(UploadConstants.ENCODING_KEY);
	}
	
	public void setEncodingType(String encodingType) throws Exception {
		setStringAttribute(UploadConstants.ENCODING_KEY,encodingType);
	}
	
	public long getSize() throws Exception {
		return getLongAttribute(UploadConstants.SIZE_KEY);
	}
	
	public void setSize(long size) throws Exception {
		setLongAttribute(UploadConstants.SIZE_KEY, size);
	}
	
	public int getHeight() throws Exception {
		return getIntAttribute(UploadConstants.HEIGHT_KEY);
	}
	
	public void setHeight(int height) throws Exception {
		setIntAttribute(UploadConstants.HEIGHT_KEY, height);
	}
	
	public int getWidth() throws Exception {
		return getIntAttribute(UploadConstants.WIDTH_KEY);
	}
	
	public void setWidth(int width) throws Exception {
		setIntAttribute(UploadConstants.WIDTH_KEY, width);
	}
	
	public String getOriginalName() throws Exception {
		return getStringAttribute(UploadConstants.ORIGINAL_NAME_KEY);
	}
	
	public void setOriginalName(String originalName) throws Exception {
		setStringAttribute(UploadConstants.ORIGINAL_NAME_KEY,originalName);
	}
	
	public String getSubmitterName() throws Exception {
		return getStringAttribute(UploadConstants.SUBMITTER_KEY);
	}
	
	public void setSubmitterName(String originalName) throws Exception {
		setStringAttribute(UploadConstants.SUBMITTER_KEY,originalName);
	}
	
	public CouchUserContext getSubmitter() throws Exception {
		CouchUserContext submitter = null;
		
		String submitterName = getSubmitterName();
		if( null != submitterName ) {
			try {
				CouchUserDb userDb = context.getClient().getUserDatabase();
				submitter = userDb.getUserFromName(submitterName);
			} catch(Exception e) {
				logger.error("Unable to obtain submitter information");
				// Ignore error
			}
		}
		
		return submitter;
	}
	
	public String getMediaFileName() throws Exception {
		return getStringAttribute(UploadConstants.MEDIA_FILE_KEY);
	}
	
	public void setMediaFileName(String encodingType) throws Exception {
		setStringAttribute(UploadConstants.MEDIA_FILE_KEY,encodingType);
	}

	public File getMediaFile() throws Exception {
		File file = null;
		
		String mediaFileName = getMediaFileName();
		if( null != mediaFileName ) {
			file = new File(context.getMediaDir(), mediaFileName);
		}
		
		return file;
	}
	
	public String getThumbnailReference() throws Exception {
		return getStringAttribute(UploadConstants.THUMBNAIL_KEY);
	}
	
	public void setThumbnailReference(String thumbnailRef) throws Exception {
		setStringAttribute(UploadConstants.THUMBNAIL_KEY, thumbnailRef);
	}
	
	public boolean isConversionPerformed() throws Exception {
		return getBooleanAttribute(UploadConstants.CONVERSION_PERFORMED_KEY);
	}
	
	public void setConversionPerformed(boolean flag) throws Exception {
		setBooleanAttribute(UploadConstants.CONVERSION_PERFORMED_KEY, flag);
	}
	
	public String getSource() throws Exception {
		return getStringAttribute(UploadConstants.SOURCE_KEY);
	}
	
	public void setSource(String source) throws Exception {
		setStringAttribute(UploadConstants.SOURCE_KEY, source);
	}
	
	public String getOriginalAttachment() throws Exception {
		return getStringAttribute(UploadConstants.ORIGINAL_ATTACHMENT_KEY);
	}
	
	public void setOriginalAttachment(String source) throws Exception {
		setStringAttribute(UploadConstants.ORIGINAL_ATTACHMENT_KEY, source);
	}

	public boolean isServerWorkDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject serverWorkDescription = attachmentDescription.optJSONObject(UploadConstants.SERVER_KEY);
		if( null == serverWorkDescription ) {
			return false;
		}
		
		return true;
	}

	public ServerWorkDescriptor getServerWorkDescription() throws Exception {
		ServerWorkDescriptor serverWorkDescription = null;
		
		if( false == isServerWorkDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.SERVER_KEY, json);
		}
		
		serverWorkDescription = new ServerWorkDescriptor(this);
		
		return serverWorkDescription;
	}

	public boolean isOriginalFileDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject json = attachmentDescription.optJSONObject(UploadConstants.ORIGINAL_FILE_KEY);
		if( null == json ) {
			return false;
		}
		
		return true;
	}

	public OriginalFileDescriptor getOriginalFileDescription() throws Exception {
		OriginalFileDescriptor serverWorkDescription = null;
		
		if( false == isOriginalFileDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.ORIGINAL_FILE_KEY, json);
		}
		
		serverWorkDescription = new OriginalFileDescriptor(this);
		
		return serverWorkDescription;
	}

	public boolean isUserDataDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject json = attachmentDescription.optJSONObject(UploadConstants.DATA_KEY);
		if( null == json ) {
			return false;
		}
		
		return true;
	}

	public UserDataDescriptor getUserDataDescription() throws Exception {
		UserDataDescriptor userDataDescription = null;
		
		if( false == isUserDataDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.DATA_KEY, json);
		}
		
		userDataDescription = new UserDataDescriptor(this);
		
		return userDataDescription;
	}

	public boolean isWorkDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject json = attachmentDescription.optJSONObject(UploadConstants.WORK_KEY);
		if( null == json ) {
			return false;
		}
		
		return true;
	}

	public WorkDescriptor getWorkDescription() throws Exception {
		
		if( false == isWorkDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.WORK_KEY, json);
		}
		
		return new WorkDescriptor(this);
	}
	
	public boolean isFilePresent() throws Exception {
		return context.isFilePresent(attachmentName);
	}
	
	public void removeFile() throws Exception {
		context.removeFile(attachmentName);
	}

	public JSONObject uploadFile(File uploadedFile, String mimeType) throws Exception {
		return context.uploadFile(attachmentName, uploadedFile, mimeType);
	}
	
	public File getMediaDir(){
		return context.getMediaDir();
	}
	
	public boolean isSavingRequired(){
		return context.isSavingRequired();
	}
	
	public void setSavingRequired(boolean flag){
		context.setSavingRequired(flag);
	}
}
