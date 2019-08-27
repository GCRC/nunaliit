package ca.carleton.gcrc.couch.onUpload;

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
	
	final static String DB_PREFIX = "delete";

	static private boolean g_propsLoaded = false;
	static private Properties g_props = null;
	static private File generatedTestDir = null;

	static private CouchClient g_client = null;
	static int g_nextId = 0;
	static boolean g_oldDbsDeleted = false;
	static boolean g_testDbCreated = false;
	static CouchDb g_testDb = null;
	
	static public Properties loadProperties() throws Exception {
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

	static public File findResourceFile(String name) {
		URL url = TestSupport.class.getClassLoader().getResource(name);
		File file = new File(url.getPath());
		return file;
	}

	static public File findTopTestingDir() {
		URL url = TestSupport.class.getClassLoader().getResource("test.properties.example");
		File file = new File(url.getPath());
		return file.getParentFile();
	}
	
	static public File getTestRunDir() throws Exception {
		if( null != generatedTestDir ){
			return generatedTestDir;
		}
		
		File testDir = findTopTestingDir();
		File generatedDir = new File(testDir, "generated");
		if( false == generatedDir.exists() ) {
			generatedDir.mkdir();
		}
		
		// find name
		int count = 0;
		while(count < 10000){
			File file = new File(generatedDir,String.format("a%1$05d", count));
			if( false == file.exists() ) {
				generatedTestDir = file;
				generatedTestDir.mkdir();
				return file;
			}
			++count;
		}
		
		throw new Exception("Testing directory is full");
	}
	
	static public File getTestDir(String name) throws Exception {
		File runDir = getTestRunDir();
		
		File testDir = new File(runDir, name);
		
		testDir.mkdirs();
		
		return testDir;
	}
	
	static public String getUserName() throws Exception {
		String userName = null;
		
		Properties props = loadProperties();
		if( null != props ) {
			userName = props.getProperty("couchdb.user");
		}
		
		return userName;
	}
	
	static public String getUserPassword() throws Exception {
		String password = null;
		
		Properties props = loadProperties();
		if( null != props ) {
			password = props.getProperty("couchdb.password");
		}
		
		return password;
	}
	
	static public CouchClient getClient() throws Exception {
		if( null == g_client ) {
			Properties props = loadProperties();
			if( null != props ) {
				CouchFactory couchFactory = new CouchFactory();
				g_client = couchFactory.getClient(props);
			}
		}
		
		return g_client;
	}

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
				g_testDb = client.createDatabase(name);
			}
			
			g_testDbCreated = true;
		}
		return g_testDb;
	}
	
	static public boolean isCouchDbTestingAvailable(){
		CouchClient client = null;
		try {
			client = getClient();
		} catch(Exception e) {
			return false;
		}
		return( null != client );
	}
}
