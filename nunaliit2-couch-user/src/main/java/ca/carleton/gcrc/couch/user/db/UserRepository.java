package ca.carleton.gcrc.couch.user.db;

import java.util.Collection;
import java.util.List;

import javax.servlet.http.Cookie;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.user.UserDocument;

public interface UserRepository {

	Collection<JSONObject> getUsersFromNames(List<String> names) throws Exception;

	JSONObject getUserFromName(String name) throws Exception;

	JSONObject getUserFromId(String id) throws Exception;

	JSONObject getUserFromEmailAddress(String emailAddress) throws Exception;

	void createUser(JSONObject userDoc) throws Exception;

	void updateUser(JSONObject userDoc) throws Exception;

	void recoverPassword(String name, String newPassword) throws Exception;
	
	CouchAuthenticationContext getRolesFromAuthentication(Cookie[] cookies) throws Exception;

	void computeUserPassword(JSONObject userDoc, String password) throws Exception;
	
	Collection<UserDocument> getUsersWithRoles(List<String> roles) throws Exception;

	boolean isEmailAddressInUse(String email) throws Exception;
}
