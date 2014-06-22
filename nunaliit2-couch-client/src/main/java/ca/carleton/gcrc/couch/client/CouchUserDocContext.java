package ca.carleton.gcrc.couch.client;

import org.json.JSONObject;

public interface CouchUserDocContext extends CouchAuthenticationContext {

	JSONObject getUserDoc();
}
