package ca.carleton.gcrc.couch.app;

import java.util.Collection;

import org.json.JSONObject;

public interface Document {
	
	String getId();

	void setId(String id) throws Exception;
	
	String getRevision();

	JSONObject getJSONObject();

	Collection<Attachment> getAttachments();
}
