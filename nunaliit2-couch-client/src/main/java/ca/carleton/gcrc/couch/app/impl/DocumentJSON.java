package ca.carleton.gcrc.couch.app.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.Document;

import org.json.JSONObject;

public class DocumentJSON implements Document {
	
	private JSONObject json;
	private Map<String,Attachment> attachments = new HashMap<String,Attachment>();

	public DocumentJSON(JSONObject json){
		this.json = json;
	}
	
	@Override
	public String getId() {
		if( null != json ) {
			String id = json.optString("_id", null);
			return id;
		}
		return null;
	}

	@Override
	public void setId(String id) throws Exception {
		json.put("_id", id);
	}

	@Override
	public String getRevision() {
		if( null != json ) {
			String id = json.optString("_rev");
			return id;
		}
		return null;
	}

	@Override
	public JSONObject getJSONObject() {
		return json;
	}

	@Override
	public Collection<Attachment> getAttachments() {
		return new ArrayList<Attachment>(attachments.values());
	}

	public void addAttachment(Attachment attachment){
		attachments.put(attachment.getName(), attachment);
	}
}
