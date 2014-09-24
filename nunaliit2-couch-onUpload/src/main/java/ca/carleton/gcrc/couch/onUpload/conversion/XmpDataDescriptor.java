package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;

public class XmpDataDescriptor extends AbstractDescriptor {

	private AttachmentDescriptor attDescription;

	public XmpDataDescriptor(AttachmentDescriptor attDescription){
		this.attDescription = attDescription;
	}

	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject attachmentDescription = attDescription.getJson();
		return attachmentDescription.getJSONObject(UploadConstants.XMP_DATA_KEY);
	}
	
	public void addData(String key, String value) throws Exception {
		setStringAttribute(key,value);
	}
}
