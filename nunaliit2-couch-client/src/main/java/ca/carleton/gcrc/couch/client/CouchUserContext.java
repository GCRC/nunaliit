package ca.carleton.gcrc.couch.client;

import java.util.List;

public interface CouchUserContext {

	String getName();

	List<String> getRoles();
}
