package ca.carleton.gcrc.couch.client;

import org.json.JSONObject;

public interface CouchUserDocContext extends CouchUserContext {

	JSONObject getUserDoc();
}
