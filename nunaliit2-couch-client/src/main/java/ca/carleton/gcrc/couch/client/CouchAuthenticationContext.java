package ca.carleton.gcrc.couch.client;

import java.util.List;

public interface CouchAuthenticationContext {

	String getName();

	List<String> getRoles();
}
