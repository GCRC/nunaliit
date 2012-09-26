package ca.carleton.gcrc.couch.client;

import java.net.URL;

public interface CouchDesignDocument {

	CouchContext getContext();
	
	CouchDb getDatabase();

	URL getUrl();
	
	CouchQueryResults performQuery(CouchQuery query) throws Exception;
	
	<T> T performQuery(CouchQuery query, Class<T> expectedClass) throws Exception;
}
