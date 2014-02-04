package ca.carleton.gcrc.couch.user.db;

import java.util.Collection;
import java.util.List;

import org.json.JSONObject;

public interface UserRepository {

	Collection<JSONObject> getUsersFromNames(List<String> names) throws Exception;

	JSONObject getUserFromName(String name) throws Exception;

	JSONObject getUserFromId(String id) throws Exception;

	JSONObject getUserFromEmailAddress(String emailAddress) throws Exception;

	void createUser(
			String name,
			String displayName,
			String password,
			String emailAddress
		) throws Exception;

	void recoverPassword(String name, String newPassword) throws Exception;
}
