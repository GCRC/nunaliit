package ca.carleton.gcrc.couch.client;

import java.net.URL;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

public interface CouchClient {

	CouchContext getContext();
	
	URL getUrl();
	
	CouchServerVersion getVersion() throws Exception;
	
	CouchSession getSession() throws Exception;

	String getUuid() throws Exception;

	String[] getUuids(int count) throws Exception;
	
	/**
	 * Performs verification of user name and password stored
	 * in the context. Raises an exception if invalid.
	 * @throws Exception
	 */
	void validateContext() throws Exception;
	
	List<String> listDatabases() throws Exception;
	
	CouchDb createDatabase(String dbName) throws Exception;

	boolean databaseExists(String dbName) throws Exception;

	CouchDb getDatabase(String dbName) throws Exception;

	void deleteDatabase(CouchDb couchDb) throws Exception;

	CouchUserDb getUserDatabase() throws Exception;
	
	JSONObject replicate(ReplicationRequest replicationRequest) throws Exception;
	
	JSONArray activeTasks() throws Exception;
}
