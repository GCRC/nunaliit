package ca.carleton.gcrc.couch.client;

import java.util.List;
import java.util.Properties;

import junit.framework.TestCase;

import org.json.JSONObject;

public class CouchClientTest extends TestCase {

	public void testGetVersion() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			CouchServerVersion version = client.getVersion();
			System.out.println("Version: "+version);
		}
	}
	
	public void testUuids() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			String uuid = client.getUuid();
			System.out.println("UUID: "+uuid);
		}
	}
	
	public void testListDatabases() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			String dbName = TestSupport.getCouchDbName(client);

			// Check initial list
			List<String> dbs = client.listDatabases();
			for(String db : dbs) {
				if( dbName.equals(db) ) {
					fail("New database already listed");
				}
			}
			
			// Create new database
			client.createDatabase(dbName);
			
			// New list should contain name
			boolean found = false;
			dbs = client.listDatabases();
			for(String db : dbs) {
				if( dbName.equals(db) ) {
					found = true;
				}
			}
			if( false == found ) {
				fail("New database should be listed");
			}
		}
	}
	
	public void testCreateDatabase() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			String dbName = TestSupport.getCouchDbName(client);

			if( client.databaseExists(dbName) ) {
				fail("Database "+dbName+" already exist");
			}
			
			// Create new database
			CouchDb db = client.createDatabase(dbName);
			
			// Verify
			if( false == client.databaseExists(dbName) ) {
				fail("New database "+dbName+" is not detected");
			}
			
			// Use
			JSONObject doc = new JSONObject();
			doc.put("test", "value");
			db.createDocument(doc);
		}
	}
	
	public void testDatabaseExists() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			String dbName = TestSupport.getCouchDbName(client);

			if( client.databaseExists(dbName) ) {
				fail("Database "+dbName+" already exist");
			}
			
			// Create new database
			CouchDb db = client.createDatabase(dbName);
			
			// Verify
			if( false == client.databaseExists(dbName) ) {
				fail("New database "+dbName+" is not detected");
			}
			
			// Delete database
			client.deleteDatabase(db);
			
			// Verify
			if( client.databaseExists(dbName) ) {
				fail("Database "+dbName+" should not be reported after deletion");
			}
		}
	}
	
	public void testDeleteDatabase() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			String dbName = TestSupport.getCouchDbName(client);

			// Create new database
			CouchDb db = client.createDatabase(dbName);
			
			// Delete database
			client.deleteDatabase(db);
			
			// Verify database is not longer reported
			if( client.databaseExists(dbName) ) {
				fail("Database "+dbName+" should not be reported after deletion");
			}
			
			// Verify we can not use database
			try {
				JSONObject doc = new JSONObject();
				doc.put("test", "value");
				db.createDocument(doc);
				
				fail("Database still operational after deletion");
				
			} catch(Exception e) {
				// That's OK. Expected error
			}
		}
	}
	
//	public void testReplicateDatabase() throws Exception {
//		CouchClient client = TestSupport.getClient();
//		if( null != client ) {
//			String dbNameSource = CouchDbTest.getCouchDbName(client);
//			String dbNameTarget = CouchDbTest.getCouchDbName(client);
//
//			// Create databases
//			CouchDb sourceDb = client.createDatabase(dbNameSource);
//			//CouchDb targetDb = 
//				client.createDatabase(dbNameTarget);
//			
//			// Use
//			JSONObject doc = new JSONObject();
//			doc.put("test", "value");
//			sourceDb.createDocument(doc);
//			
//			// Start Replication
//			ReplicationRequest request = new ReplicationRequest();
//			request.setSourceDbName(dbNameSource);
//			request.setTargetDbName(dbNameTarget);
//			request.setContinuous(true);
//			//JSONObject replicateResponse = 
//				client.replicate(request);
//			
//			// Verify that it is started
//			boolean started = false;
//			for(int loop=0; loop<5; ++loop) {
//				JSONArray tasks = client.activeTasks();
//				ReplicationStatus status = 
//					ReplicationStatus.findReplicationTask(tasks, dbNameSource, dbNameTarget);
//				if( null != status ) {
//					started = true;
//					break;
//				}
//			}
//			if( !started ) {
//				fail("Can not find replication task");
//				return;
//			}
//			
//			// Stop Replication
//			request.setCancel(true);
//			client.replicate(request);
//			
//			// Verify that it is stopped
//			boolean stopped = false;
//			for(int loop=0; loop<5; ++loop) {
//				JSONArray tasks = client.activeTasks();
//				ReplicationStatus status = 
//					ReplicationStatus.findReplicationTask(tasks, dbNameSource, dbNameTarget);
//				if( null == status ) {
//					stopped = true;
//					break;
//				}
//			}
//			if( !stopped ) {
//				fail("Can not stop replication task");
//				return;
//			}
//		}
//	}
	
	public void testActiveTasks() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {

			client.activeTasks();
		}
	}
	
	public void testValidateContext() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			// This should be valid
			client.validateContext();
		}
	}
	
	public void testInvalidUsernamePassword() throws Exception {
		Properties props = TestSupport.loadProperties();
		if( null != props ) {
			// Test should be performed only if testing is set
			// by creating a properties file
			CouchFactory couchFactory = new CouchFactory();
			
			// Adjust properties to reflect a bad password
			Properties propClone = (Properties)props.clone();
			propClone.setProperty("couchdb.password","invalidPassword");
			
			// Create a client
			CouchClient client = couchFactory.getClient(propClone);
			
			try {
				client.validateContext();
				
				fail("Should not reach here");
				
			} catch(Exception e) {
				// OK
			}
		}
	}
}
