package ca.carleton.gcrc.couch.client;

import java.net.URL;

public interface CouchSession {

	CouchContext getContext();
	
	CouchClient getClient();
	
	URL getUrl();
	
	CouchAuthenticationContext getAuthenticationContext() throws Exception;
	
	CouchContext createSession(String userName, String password) throws Exception;

}
