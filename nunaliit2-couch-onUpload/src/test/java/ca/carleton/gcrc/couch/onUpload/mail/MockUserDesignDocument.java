package ca.carleton.gcrc.couch.onUpload.mail;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.user.UserDesignDocument;
import ca.carleton.gcrc.couch.user.UserDocument;

public class MockUserDesignDocument implements UserDesignDocument {

	private String emailAddress = null;
	private String displayName = null;

	@Override
	public CouchDesignDocument getSupportingDesignDocument() {
		return null;
	}

	@Override
	public Collection<UserDocument> getUsersWithRole(String role) throws Exception {
		List<String> roles = new ArrayList<String>(1);
		roles.add(role);
		return getUsersWithRoles(roles);
	}

	@Override
	public Collection<UserDocument> getUsersWithRoles(List<String> roles) throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("_id", "org.couchdb.user:test");
		obj.put("name", "test");
		obj.put("type", "user");
		
		if( null != displayName ){
			obj.put("display", displayName);
		}
		if( null != emailAddress ){
			JSONArray ary = new JSONArray();
			ary.put(emailAddress);
			obj.put("nunaliit_emails", ary);
		}
		if( null != roles ){
			JSONArray ary = new JSONArray();
			for(String role : roles){
				ary.put(role);
			}
			obj.put("roles", ary);
		}
		
		UserDocument user = new UserDocument(obj);
		List<UserDocument> users = new ArrayList<UserDocument>(1);
		users.add(user);
		return users;
	}

	public String getEmailAddress() {
		return emailAddress;
	}

	public void setEmailAddress(String emailAddress) {
		this.emailAddress = emailAddress;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}
}
