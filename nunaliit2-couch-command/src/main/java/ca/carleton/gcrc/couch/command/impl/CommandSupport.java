package ca.carleton.gcrc.couch.command.impl;

import java.util.Properties;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.command.AtlasProperties;
import ca.carleton.gcrc.couch.command.GlobalSettings;

public class CommandSupport {

	static public CouchClient createCouchClient(
		GlobalSettings gs
		,AtlasProperties atlasProperties
		) throws Exception {
		
		// Create couch client
		CouchClient couchClient = null;
		{
			Properties couchClientProps = new Properties();
			couchClientProps.put("couchdb.server", atlasProperties.getCouchDbUrl().toExternalForm());
			couchClientProps.put("couchdb.user", atlasProperties.getCouchDbAdminUser());
			couchClientProps.put("couchdb.password", atlasProperties.getCouchDbAdminPassword());
	
			CouchFactory couchFactory = new CouchFactory();
			couchClient = couchFactory.getClient(couchClientProps);
			
			// Verify that we can connect to the server
			try {
				couchClient.validateContext();
			} catch(Exception e) {
				throw new Exception("Unable to connect to the server. Probably wrong user name or password.",e);
			}
		}
		return couchClient;
	}

	static public CouchDb createCouchDb(
		GlobalSettings gs
		,AtlasProperties atlasProperties
		) throws Exception {
		
		CouchClient couchClient = createCouchClient(gs, atlasProperties);
		
		// Get database from Couch Client
		CouchDb couchDb = null;
		{
			String dbName = atlasProperties.getCouchDbName();
			if( false == couchClient.databaseExists(dbName) ) {
				couchClient.createDatabase(dbName);
			}
			couchDb = couchClient.getDatabase(dbName);
		}
		return couchDb;
	}
}
