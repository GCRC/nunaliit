package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;

public class PhotosphereDescriptor extends AbstractDescriptor {

	private AttachmentDescriptor attDescription;

	public PhotosphereDescriptor(AttachmentDescriptor attDescription){
		this.attDescription = attDescription;
	}

	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject attachmentDescription = attDescription.getJson();
		return attachmentDescription.getJSONObject(UploadConstants.PHOTOSPHERE_DATA_KEY);
	}
	
	public String getType() throws Exception {
		return getStringAttribute("type");
	}
	
	public void setType(String type) throws Exception {
		setStringAttribute("type",type);
	}
}
