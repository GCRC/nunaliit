package ca.carleton.gcrc.couch.client;

import java.util.Collection;

import org.json.JSONObject;

public interface CouchDbSecurityDocument {

	JSONObject getJSON();
	
	Collection<String> getAdminUsers();
	
	void addAdminUser(String name) throws Exception;
	
	void removeAdminUser(String name) throws Exception;
	
	Collection<String> getAdminRoles();
	
	void addAdminRole(String name) throws Exception;
	
	void removeAdminRole(String name) throws Exception;
	
	Collection<String> getMemberUsers();
	
	void addMemberUser(String name) throws Exception;
	
	void removeMemberUser(String name) throws Exception;
	
	Collection<String> getMemberRoles();
	
	void addMemberRole(String name) throws Exception;
	
	void removeMemberRole(String name) throws Exception;
}
