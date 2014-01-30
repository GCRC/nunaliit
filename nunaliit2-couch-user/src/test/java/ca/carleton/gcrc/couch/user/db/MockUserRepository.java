package ca.carleton.gcrc.couch.user.db;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

public class MockUserRepository implements UserRepository {

	private Map<String,JSONObject> usersById = new HashMap<String,JSONObject>();
	private Map<String,JSONObject> usersByEmail = new HashMap<String,JSONObject>();
	
	public MockUserRepository(){
		
	}
	
	public JSONObject addUser(String name, String displayName, String emailAddress) throws Exception {
		createUser(name, displayName, "", emailAddress);

		String id = "org.couchdb.user:"+name;
		JSONObject user = usersById.get(id);

		return user;
	}
	
	@Override
	public Collection<JSONObject> getUsersFromNames(List<String> names) throws Exception {
		List<JSONObject> userDocs = new ArrayList<JSONObject>(names.size());

		for(String n : names){
			String id = "org.couchdb.user:"+n;
			JSONObject user = usersById.get(id);
			userDocs.add(user);
		}
		
		return userDocs;
	}

	@Override
	public JSONObject getUserFromName(String name) throws Exception {
		String id = "org.couchdb.user:"+name;
		return getUserFromId(id);
	}

	@Override
	public JSONObject getUserFromId(String id) throws Exception {
		JSONObject user = usersById.get(id);
		if( null == user ){
			throw new Exception("User not found: "+id);
		}
		return user;
	}

	@Override
	public JSONObject getUserFromEmailAddress(String emailAddress) throws Exception {
		JSONObject user = usersByEmail.get(emailAddress);
		if( null == user ){
			throw new Exception("User not found. Email: "+emailAddress);
		}
		return user;
	}

	@Override
	public void createUser(
			String name, 
			String displayName, 
			String password,
			String emailAddress) throws Exception {
		JSONObject user = new JSONObject();
		
		String id = "org.couchdb.user:"+name;
		usersById.put(id, user);
		
		user.put("_id", id);
		user.put("name", name);
		user.put("name", password);
		user.put("type", "user");
		user.put("roles", new JSONArray());
		user.put("nunaliit_options", new JSONObject());
		user.put("nunaliit_emails", new JSONArray());
		user.put("nunaliit_validated_emails", new JSONArray());

		if( null != displayName ){
			user.put("display", displayName);
		}

		if( null != emailAddress ){
			JSONArray validatedEmails = user.getJSONArray("nunaliit_validated_emails");
			validatedEmails.put(emailAddress);
			
			usersByEmail.put(emailAddress, user);
		}
	}

}
