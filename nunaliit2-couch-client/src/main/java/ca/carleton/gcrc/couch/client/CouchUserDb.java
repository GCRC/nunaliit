package ca.carleton.gcrc.couch.client;

public interface CouchUserDb extends CouchDb {

	CouchUserDocContext getUserFromName(String userName) throws Exception;
}
