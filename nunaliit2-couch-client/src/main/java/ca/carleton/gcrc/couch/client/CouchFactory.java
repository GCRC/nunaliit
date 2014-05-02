package ca.carleton.gcrc.couch.client;

import java.net.URL;
import java.util.Properties;

import ca.carleton.gcrc.couch.client.impl.CouchClientImpl;
import ca.carleton.gcrc.couch.client.impl.CouchContextNull;
import ca.carleton.gcrc.couch.client.impl.CouchContextUsernamePassword;
import ca.carleton.gcrc.couch.client.impl.CouchDbImpl;
import ca.carleton.gcrc.couch.client.impl.CouchServerVersionImpl;

public class CouchFactory {
	
	public CouchContext getContext() {
		return new CouchContextNull();
	}
	
	public CouchContext getContext(String username, char[] password) {
		return new CouchContextUsernamePassword(username, password);
	}

	public CouchClient getClient(CouchContext context, URL url) throws Exception {
		CouchClientImpl client = new CouchClientImpl(context, url);
		
		return client;
	}

	public CouchClient getClient(CouchContext context, URL url, int versionMajor, int versionMinor) throws Exception {
		CouchClientImpl client = new CouchClientImpl(context, url);
		
		CouchServerVersionImpl serverVersion = new CouchServerVersionImpl(""+versionMajor+"."+versionMinor,versionMajor, versionMinor);
		client.setVersion(serverVersion);
		
		return client;
	}

	public CouchClient getClient(CouchContext context, CouchClient clonedClient) throws Exception {
		CouchClientImpl client = new CouchClientImpl(context, clonedClient.getUrl());
		
		client.setVersion(clonedClient.getVersion());
		
		return client;
	}

	public CouchClient getClient(Properties props) throws Exception {
		
		String urlString = props.getProperty("couchdb.server");
		String user = props.getProperty("couchdb.user");
		String password = props.getProperty("couchdb.password");
		String version = props.getProperty("couchdb.version");
		
		// Figure out context
		CouchContext context = getContext();
		if( null != user && null != password ) {
			context = getContext(user,password.toCharArray());
		}
		
		// Figure out version
		CouchServerVersionImpl serverVersion = null;
		if( null != version ) {
			String[] parts = version.split("\\.");
			if( parts.length < 2 ) {
				throw new Exception("Can not parse server version: "+version);
			}
			serverVersion = new CouchServerVersionImpl(version, Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
		}
		
		// Compute URL
		URL url = new URL(urlString);
		
		// Instantiate client
		CouchClientImpl client = new CouchClientImpl(context, url);
		
		if( null != serverVersion ) {
			client.setVersion(serverVersion);
		}
		
		return client;
	}

	public CouchDb getDb(CouchClient client, String dbName) throws Exception {
		// Compute URL
		URL url = new URL(client.getUrl(), dbName+"/");
		return getDb(client, url);
	}

	public CouchDb getDb(CouchClient client, URL dbUrl) throws Exception {
		CouchDbImpl couchDb = new CouchDbImpl(client, dbUrl);
		
		return couchDb;
	}

	public CouchDb getDb(CouchContext context, CouchDb clonedDb) throws Exception {
		CouchClient client = getClient(context, clonedDb.getClient());
		CouchDbImpl couchDb = new CouchDbImpl(client, clonedDb.getUrl());
		
		return couchDb;
	}
}
