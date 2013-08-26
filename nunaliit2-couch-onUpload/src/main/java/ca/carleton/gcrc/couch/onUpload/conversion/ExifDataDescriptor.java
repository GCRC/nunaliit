package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;

public class ExifDataDescriptor extends AbstractDescriptor {

	private AttachmentDescriptor attDescription;

	public ExifDataDescriptor(AttachmentDescriptor attDescription){
		this.attDescription = attDescription;
	}

	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject attachmentDescription = attDescription.getJson();
		return attachmentDescription.getJSONObject(UploadConstants.EXIF_DATA_KEY);
	}

	@Override
	protected void setSavingRequired(boolean flag) {
		attDescription.setSavingRequired(flag);
	}
	
	public void addData(String key, String value) throws Exception {
		setStringAttribute(key,value);
	}
}
