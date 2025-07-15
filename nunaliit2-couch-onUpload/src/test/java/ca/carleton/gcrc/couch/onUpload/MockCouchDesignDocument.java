package ca.carleton.gcrc.couch.onUpload;

import java.net.URL;

import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.impl.ConnectionStreamResult;

public class MockCouchDesignDocument implements CouchDesignDocument {
    private CouchDb database;
    private URL URL;

    public MockCouchDesignDocument(CouchDb database, URL url) {
        this.database = database;
        this.URL = url;
    }

    @Override
    public CouchContext getContext() {
        return null;
    }

    @Override
    public CouchDb getDatabase() {
        return database;
    }

    @Override
    public URL getUrl() {
        return URL;
    }

    @Override
    public CouchQueryResults performQuery(CouchQuery query) throws Exception {
        MockCouchQueryResults results;
		try {
			results = new MockCouchQueryResults();
		} catch (Exception e) {
			throw new Exception("Error while parsing query response",e);
		}
		
		return results;
    }

    @Override
    public CouchQueryResults performQueryAsPost(CouchQuery query) throws Exception {
        return null;
    }

    @Override
    public ConnectionStreamResult performQueryRaw(CouchQuery query) throws Exception {
        return null;
    }

    @Override
    public <T> T performQuery(CouchQuery query, Class<T> expectedClass) throws Exception {
        return null;
    }
}
