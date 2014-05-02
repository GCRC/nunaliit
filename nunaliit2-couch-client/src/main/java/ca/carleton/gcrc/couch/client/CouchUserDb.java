package ca.carleton.gcrc.couch.client;

import org.json.JSONObject;

public interface CouchUserDb extends CouchDb {

	CouchUserDocContext getUserFromName(String userName) throws Exception;
	
	/**
	 * Does not call the database. Instead, modifies the given user document
	 * to reflect a new password.
	 * @param userDoc User document to be modified
	 * @param password PLain text password to be assigned to the user
	 * @throws Exception
	 */
	void computeUserPassword(JSONObject userDoc, String password) throws Exception;
}
