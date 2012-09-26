package ca.carleton.gcrc.couch.client;

public interface CouchUserDb extends CouchDb {

	CouchUserContext getUserFromName(String userName) throws Exception;
}
