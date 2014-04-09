package ca.carleton.gcrc.couch.user.db;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.couch.client.CouchUserContext;

public class MockCouchUserContext implements CouchUserContext {

	private String name;
	private List<String> roles;
	
	public MockCouchUserContext(String name){
		this.name = name;
		this.roles = new Vector<String>();
	}
	
	@Override
	public String getName() {
		return name;
	}

	@Override
	public List<String> getRoles() {
		return roles;
	}

	public void addRole(String role){
		roles.add(role);
	}
}
