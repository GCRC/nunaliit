package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import org.json.JSONObject;

public class Attachment {

	private String attachmentName;
	private JSONObject attachment;
	
	public Attachment(String attachmentName, JSONObject attachment) {
		this.attachmentName = attachmentName;
		this.attachment = attachment;
	}
	
	public JSONObject getJsonObject() {
		return attachment;
	}
	
	public String getName() {
		return attachmentName;
	}
	
	public String getContentType(){
		return attachment.optString("content_type");
	}
}
