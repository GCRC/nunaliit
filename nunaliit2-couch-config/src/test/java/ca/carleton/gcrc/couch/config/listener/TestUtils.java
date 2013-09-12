package ca.carleton.gcrc.couch.config.listener;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class TestUtils {
	final static String DB_PREFIX = "delete";

	static public File getTestFile(String resourceName) {
		URL url = TestUtils.class.getClassLoader().getResource(resourceName);
		return new File(url.getFile());
	}
	
	static public File getTestResourceDir() {
		File testPropFile = getTestFile("test.properties.example");
		return testPropFile.getParentFile();
	}
	
	
	static private CouchClient g_client = null;
	static private boolean g_propsLoaded = false;
	
	static public CouchClient getClient() throws Exception {
		if( false == g_propsLoaded ) {
			InputStream propStream = 
				TestUtils.class.getClassLoader().getResourceAsStream("test.properties");
			if( null != propStream ) {
				Properties props = new Properties();
				props.load(propStream);
				
				CouchFactory couchFactory = new CouchFactory();
				g_client = couchFactory.getClient(props);
			}

			g_propsLoaded = true;
		}
		
		return g_client;
	}

	static int g_nextId = 0;
	static boolean g_oldDbsDeleted = false;
	static boolean g_testDbCreated = false;
	static CouchDb g_testDb = null;

	static public String getCouchDbName(CouchClient client) throws Exception {
		// Once, the first time called, delete old database so that names do not
		// clash from previous runs
		if( false == g_oldDbsDeleted ) {
			// Delete previous test databases
			List<String> dbsToDelete = new Vector<String>();
			List<String> dbs = client.listDatabases();
			for(String dbName : dbs) {
				if(dbName.startsWith(DB_PREFIX)) {
					dbsToDelete.add(dbName);
				}
			}
			for(String dbName : dbsToDelete) {
				CouchDb db = client.getDatabase(dbName);
				client.deleteDatabase(db);
			}
			
			g_oldDbsDeleted = true;
		}
		
		// Look for a new name
		int limit = 100;
		while( limit > 0 ) {
			String name = DB_PREFIX+g_nextId;
			++g_nextId;
			
			if( false == client.databaseExists(name) ) {
				return name;
			}
			
			--limit;
		}
		
		throw new Exception("Unable to find appropriate database name");
	}
	
	static public CouchDb getTestCouchDb() throws Exception {
		if( false == g_testDbCreated ) {
			CouchClient client = getClient();
			if( null != client ) {
				String name = getCouchDbName(client);
				CouchDb db = client.createDatabase(name);
				
				// Upload config design document...
				File configDdFile = new File(getTestResourceDir(), "configDesignDocument");

				FSEntry designDocLocation = new FSEntryFile(configDdFile);
				Document designDoc = DocumentFile.createDocument(designDocLocation);
				
				// Get JSON from it
				JSONObject jsonObj = designDoc.getJSONObject();
				
				// Assign id
				jsonObj.put("_id", "_design/config");
				
				// Create
				db.createDocument(jsonObj);
				
				g_testDb = db;
			}
			
			g_testDbCreated = true;
		}
		return g_testDb;
	}
}
