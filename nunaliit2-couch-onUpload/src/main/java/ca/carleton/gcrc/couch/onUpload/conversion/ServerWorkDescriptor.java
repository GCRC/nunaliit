package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;

public class ServerWorkDescriptor extends AbstractDescriptor {

	private AttachmentDescriptor attDescription;
	
	public ServerWorkDescriptor(AttachmentDescriptor attDescription){
		this.attDescription = attDescription;
	}
	
	public int getOrientationLevel() throws Exception {
		JSONObject serverWorkObj = getJson();
		int orientationLevel = serverWorkObj.optInt(UploadConstants.SERVER_ORIENTATION_KEY, 0);
		return orientationLevel;
	}
	
	public void setOrientationLevel(int level) throws Exception {
		JSONObject serverWorkObj = getJson();
		serverWorkObj.put(UploadConstants.SERVER_ORIENTATION_KEY, UploadConstants.SERVER_ORIENTATION_VALUE);
		attDescription.setSavingRequired(true);
	}
	
	public int getThumbnailLevel() throws Exception {
		JSONObject serverWorkObj = getJson();
		int thumbnailLevel = serverWorkObj.optInt(UploadConstants.SERVER_THUMBNAIL_KEY, 0);
		return thumbnailLevel;
	}
	
	public void setThumbnailLevel(int level) throws Exception {
		JSONObject serverWorkObj = getJson();
		serverWorkObj.put(UploadConstants.SERVER_THUMBNAIL_KEY, UploadConstants.SERVER_THUMBNAIL_VALUE);
		attDescription.setSavingRequired(true);
	}
	
	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject attachmentDescription = attDescription.getJson();
		return attachmentDescription.getJSONObject(UploadConstants.SERVER_KEY);
	}

	@Override
	protected void setSavingRequired(boolean flag) {
		attDescription.setSavingRequired(flag);
	}
}
