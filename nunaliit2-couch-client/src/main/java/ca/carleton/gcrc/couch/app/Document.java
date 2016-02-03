package ca.carleton.gcrc.couch.app;

import java.util.Collection;

import org.json.JSONObject;

public interface Document {
	
	String getId();

	void setId(String id) throws Exception;
	
	String getRevision();

	JSONObject getJSONObject();

	Collection<Attachment> getAttachments();
	
	/**
	 * Returns the attachment associated with the given name.
	 * Return null if attachment does not exist.
	 * @param attachmentName Name of seeked attachment
	 * @return The named attachment, or null if not found
	 */
	Attachment getAttachmentByName(String attachmentName);
}
