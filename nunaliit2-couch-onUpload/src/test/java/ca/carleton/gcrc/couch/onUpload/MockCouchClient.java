package ca.carleton.gcrc.couch.onUpload;

import java.util.List;
import java.net.URL;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchServerVersion;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.ReplicationRequest;

public class MockCouchClient implements CouchClient{
    public MockCouchClient() throws Exception {}

    @Override
    public CouchContext getContext() {
        return null;
    }
	
	@Override
    public URL getUrl() {
        return null;
    }
	
	@Override
    public CouchServerVersion getVersion() throws Exception {
        return null;
    }
	
	@Override
    public CouchSession getSession() throws Exception {
        return null;
    }

	@Override
    public String getUuid() throws Exception {
        return null;
    }

	@Override
    public String[] getUuids(int count) throws Exception {
        String[] results = new String[count];
        for (Integer c = 0; c < count; c++) {
            results[c] = c.toString();
        }
        return results;
    }
	
	@Override
    public void validateContext() throws Exception {}
	
    @Override
    public List<String> listDatabases() throws Exception {
        return null;
    }
	
	@Override
    public CouchDb createDatabase(String dbName) throws Exception {
        return null;
    }

	@Override
    public boolean databaseExists(String dbName) throws Exception {
        return false;
    }

	@Override
    public CouchDb getDatabase(String dbName) throws Exception {
        return null;
    }

	@Override
    public void deleteDatabase(CouchDb couchDb) throws Exception {}

	@Override
    public CouchUserDb getUserDatabase() throws Exception {
        return null;
    }
	
	@Override
    public JSONObject replicate(ReplicationRequest replicationRequest) throws Exception {
        return null;
    }
	
	@Override
    public JSONArray activeTasks() throws Exception {
        return null;
    }
}
