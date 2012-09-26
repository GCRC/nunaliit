package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchFactory;

public class TestSupport {

	static public File findTopTestingDir() {
		URL url = TestSupport.class.getClassLoader().getResource("test.properties.example");
		File file = new File(url.getPath());
		return file.getParentFile();
	}

	static public File generateTestDirName() throws Exception {
		File testDir = findTopTestingDir();
		File generatedDir = new File(testDir, "generated");
		
		// find name
		int count = 0;
		while(count < 10000){
			File file = new File(generatedDir,String.format("a%1$05d", count));
			if( false == file.exists() ) {
				return file;
			}
			++count;
		}
		
		throw new Exception("Testing directory is full");
	}

	static private boolean g_propsLoaded = false;
	static private Properties g_props = null;
	
	static public Properties loadTestProperties() throws Exception {
		if( false == g_propsLoaded ) {
			InputStream propStream = 
				TestSupport.class.getClassLoader().getResourceAsStream("test.properties");
			if( null != propStream ) {
				g_props = new Properties();
				g_props.load(propStream);
			}

			g_propsLoaded = true;
		}
		return g_props;
	}
	
	static private CouchClient g_client = null;
	
	static public CouchClient getTestCouchClient() throws Exception {
		if( null == g_client ) {
			Properties props = loadTestProperties();
			if( null != props ) {
				CouchFactory couchFactory = new CouchFactory();
				g_client = couchFactory.getClient(props);
			}
		}
		
		return g_client;
	}
	
	final static String DB_PREFIX = "delete";
	static boolean g_oldDbsDeleted = false;
	static int g_nextId = 0;
	
	static public String getNewTestCouchDbName(CouchClient client) throws Exception {
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
}
