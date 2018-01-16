package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;
import java.util.Iterator;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;

public class AttachmentDescriptor extends AbstractDescriptor {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private DocumentDescriptor documentDescriptor;
	private String attName; // null if stored on context
	
	public AttachmentDescriptor(DocumentDescriptor documentDescriptor, String attName){
		this.documentDescriptor = documentDescriptor;
		this.attName = attName;
	}
	
	public DocumentDescriptor getDocumentDescriptor(){
		return documentDescriptor;
	}
	
	public FileConversionContext getContext(){
		return documentDescriptor.getContext();
	}
	
	public JSONObject getJson() throws Exception {
		
		JSONObject doc = documentDescriptor.getJson();
		JSONObject attachments = doc.getJSONObject(UploadConstants.KEY_DOC_ATTACHMENTS);
		JSONObject files = attachments.getJSONObject("files");
		JSONObject attachmentDescription = files.getJSONObject(attName);
		
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
	
	/**
	 * Renames an attachment. This ensures that there is no collision and that
	 * all references to this attachment are updated properly, within this document.
	 * @param newAttachmentName The new attachment name.
	 * @throws Exception
	 */
	public void renameAttachmentTo(String newAttachmentName) throws Exception {
		JSONObject doc = documentDescriptor.getJson();
		JSONObject _attachments = doc.optJSONObject("_attachments");
		JSONObject nunaliit_attachments = doc.getJSONObject(UploadConstants.KEY_DOC_ATTACHMENTS);
		JSONObject files = nunaliit_attachments.getJSONObject("files");

		// Verify no collision within nunaliit_attachments.files
		{
			Object obj = files.opt(newAttachmentName);
			if( null != obj ){
				throw new Exception("Can not rename attachment because of name collision");
			}
		}
		
		// Verify no collision within _attachments
		if( null != _attachments ){
			Object obj = _attachments.opt(newAttachmentName);
			if( null != obj ){
				throw new Exception("Can not rename attachment because of name collision");
			}
		}

		// Not allowed to move a stub		
		if( null != _attachments ){
			JSONObject att = _attachments.optJSONObject(attName);
			if( null != att ){
				throw new Exception("Can not rename attachment descriptor because file is already attached");
			}
		}
		
		// Move descriptor to new name
		String oldAttachmentName = attName;
		JSONObject descriptor = files.getJSONObject(oldAttachmentName);
		files.remove(oldAttachmentName);
		files.put(newAttachmentName, descriptor);
		attName = newAttachmentName;
		setStringAttribute(UploadConstants.ATTACHMENT_NAME_KEY,newAttachmentName);
		
		// Loop through all attachment descriptors, updating "source", "thumbnail"
		// and "original" attributes
		{
			Iterator<?> it = files.keys();
			while( it.hasNext() ){
				Object objKey = it.next();
				if( objKey instanceof String ){
					String key = (String)objKey;
					JSONObject att = files.getJSONObject(key);
					
					{
						String value = att.optString("source", null);
						if( oldAttachmentName.equals(value) ){
							att.put("source", newAttachmentName);
						}
					}

					{
						String value = att.optString("thumbnail", null);
						if( oldAttachmentName.equals(value) ){
							att.put("thumbnail", newAttachmentName);
						}
					}

					{
						String value = att.optString("originalAttachment", null);
						if( oldAttachmentName.equals(value) ){
							att.put("original", newAttachmentName);
						}
					}
				}
			}
		}
	}
	
	public void remove() throws Exception {
		JSONObject doc = documentDescriptor.getJson();
		JSONObject nunaliit_attachments = doc.getJSONObject(UploadConstants.KEY_DOC_ATTACHMENTS);
		JSONObject files = nunaliit_attachments.getJSONObject("files");

		// This line will raise an error if the descriptor was already removed
		files.getJSONObject(attName);
		
		// Perform removal
		files.remove(attName);

		// Remove attachments if this was the last one
		{
			int count = 0;
			
			Iterator<?> it = files.keys();
			while( it.hasNext() ){
				Object objKey = it.next();
				if( objKey instanceof String ){
					++count;
				}
			}
			
			if( count < 1 ){
				doc.remove(UploadConstants.KEY_DOC_ATTACHMENTS);
			}
		}
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
	
	public CouchAuthenticationContext getSubmitter() throws Exception {
		CouchAuthenticationContext submitter = null;
		
		String submitterName = getSubmitterName();
		if( null != submitterName ) {
			try {
				submitter = getContext().getUserFromName(submitterName);
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
			file = getContext().getMediaFileFromName(mediaFileName);
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

	public String getUploadId() throws Exception {
		return getStringAttribute(UploadConstants.UPLOAD_ID_KEY);
	}
	
	public void setUploadId(String uploadId) throws Exception {
		setStringAttribute(UploadConstants.UPLOAD_ID_KEY,uploadId);
	}

	public boolean isOriginalUpload() throws Exception {
		return getBooleanAttribute(UploadConstants.IS_ORIGINAL_UPLOAD_KEY);
	}
	
	public void setOriginalUpload(boolean flag) throws Exception {
		setBooleanAttribute(UploadConstants.IS_ORIGINAL_UPLOAD_KEY,flag);
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

	public boolean isExifDataDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject json = attachmentDescription.optJSONObject(UploadConstants.EXIF_DATA_KEY);
		if( null == json ) {
			return false;
		}
		
		return true;
	}

	public ExifDataDescriptor getExifDataDescription() throws Exception {
		
		if( false == isExifDataDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.EXIF_DATA_KEY, json);
		}
		
		return new ExifDataDescriptor(this);
	}

	public boolean isXmpDataDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject json = attachmentDescription.optJSONObject(UploadConstants.XMP_DATA_KEY);
		if( null == json ) {
			return false;
		}
		
		return true;
	}

	public XmpDataDescriptor getXmpDataDescription() throws Exception {
		
		if( false == isXmpDataDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.XMP_DATA_KEY, json);
		}
		
		return new XmpDataDescriptor(this);
	}

	public boolean isPhotosphereDescriptionAvailable() throws Exception {
		JSONObject attachmentDescription = getJson();

		JSONObject json = attachmentDescription.optJSONObject(UploadConstants.PHOTOSPHERE_DATA_KEY);
		if( null == json ) {
			return false;
		}
		
		return true;
	}

	public PhotosphereDescriptor getPhotosphereDescription() throws Exception {
		
		if( false == isPhotosphereDescriptionAvailable() ){
			JSONObject attachmentDescription = getJson();
			
			JSONObject json = new JSONObject();
			attachmentDescription.put(UploadConstants.PHOTOSPHERE_DATA_KEY, json);
		}
		
		return new PhotosphereDescriptor(this);
	}
	
	public boolean isFilePresent() throws Exception {
		return documentDescriptor.isFilePresent(attName);
	}
	
	public void removeFile() throws Exception {
		documentDescriptor.removeFile(attName);
	}

	public void uploadFile(File uploadedFile, String mimeType) throws Exception {
		getContext().uploadFile(attName, uploadedFile, mimeType);
	}
}
