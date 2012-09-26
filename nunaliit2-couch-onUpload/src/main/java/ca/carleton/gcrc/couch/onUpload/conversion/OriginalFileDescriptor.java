package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;

import org.json.JSONObject;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.json.JSONSupport;

public class OriginalFileDescriptor extends AbstractDescriptor {

	private AttachmentDescriptor attDescription;
	
	public OriginalFileDescriptor(AttachmentDescriptor attDescription){
		this.attDescription = attDescription;
	}

	public File getMediaFile() throws Exception {
		File file = null;
		
		JSONObject originalObj = getJson();
		if( JSONSupport.containsKey(originalObj, UploadConstants.MEDIA_FILE_KEY) ) {
			String mediaFileName = originalObj.optString(UploadConstants.MEDIA_FILE_KEY);
			file = new File(attDescription.getMediaDir(), mediaFileName);
		}
		
		return file;
	}
	
	public String getMediaFileName() throws Exception {
		return getStringAttribute(UploadConstants.MEDIA_FILE_KEY);
	}
	
	public void setMediaFileName(String mediaFileName) throws Exception {
		setStringAttribute(UploadConstants.MEDIA_FILE_KEY,mediaFileName);
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
	
	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject attachmentDescription = attDescription.getJson();
		
		JSONObject originalFileDescription = attachmentDescription.optJSONObject(UploadConstants.ORIGINAL_FILE_KEY);
		
		return originalFileDescription;
	}

	@Override
	protected void setSavingRequired(boolean flag) {
		attDescription.setSavingRequired(flag);
	}
}
