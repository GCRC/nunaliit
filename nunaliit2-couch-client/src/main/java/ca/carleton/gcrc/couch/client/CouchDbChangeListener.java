package ca.carleton.gcrc.couch.client;

import org.json.JSONObject;

public interface CouchDbChangeListener {

	public enum Type {
		DOC_CREATED
		,DOC_UPDATED
		,DOC_DELETED
	};
	
	void change(Type type, String docId, String rev, JSONObject rawChange, JSONObject doc);
}
