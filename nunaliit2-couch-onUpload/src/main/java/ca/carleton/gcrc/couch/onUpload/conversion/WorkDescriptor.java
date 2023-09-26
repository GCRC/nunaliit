package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.json.JSONSupport;

public class WorkDescriptor extends AbstractDescriptor {

	private AttachmentDescriptor attDescription;
	
	public WorkDescriptor(AttachmentDescriptor attDescription){
		this.attDescription = attDescription;
	}

	public boolean isKeyAvailable(String key) throws Exception {
		JSONObject descriptionObj = getJson();
		return JSONSupport.containsKey(descriptionObj, key);
	}
	
	public String getStringAttribute(String key) throws Exception {
		String value = null;

		JSONObject descriptionObj = getJson();
		if( JSONSupport.containsKey(descriptionObj, key) ) {
			value = descriptionObj.optString(key, null);
		}
		
		return value;
	}
	
	public void setStringAttribute(String key, String value) throws Exception {
		JSONObject descriptionObj = getJson();
		descriptionObj.put(key,value);
	}
	
	public void removeAttribute(String key) throws Exception {
		JSONObject descriptionObj = getJson();
		if( JSONSupport.containsKey(descriptionObj, key) ) {
			descriptionObj.remove(key);
		}
	}
	
	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject attachmentDescription = attDescription.getJson();
		
		return attachmentDescription.getJSONObject(UploadConstants.WORK_KEY);
	}
}
