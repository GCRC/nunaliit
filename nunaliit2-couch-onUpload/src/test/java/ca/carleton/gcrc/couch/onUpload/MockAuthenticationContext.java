package ca.carleton.gcrc.couch.onUpload;

import java.util.ArrayList;
import java.util.List;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;

public class MockAuthenticationContext implements CouchAuthenticationContext {

	@Override
	public String getName() {
		return "user";
	}

	@Override
	public List<String> getRoles() {
		ArrayList<String> roles = new ArrayList<String>();
		return roles;
	}

}
