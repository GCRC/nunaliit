package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

import junit.framework.TestCase;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.command.impl.SkeletonDocumentsDetector;

public class SkeletonDocumentsDetectorTest extends TestCase {

	public void testDocIds() throws Exception {
		CouchClient couchClient = TestSupport.getTestCouchClient();
		if( null != couchClient ){
			String couchDbName = TestSupport.getNewTestCouchDbName(couchClient);
			Properties testProperties = TestSupport.loadTestProperties();

			GlobalSettings globalSettings = new GlobalSettings();
			Main main = new Main();
			
			// Figure out testing location
			File loc = TestSupport.generateTestDirName();
			String locString = loc.getAbsolutePath();

			// Create project
			{
				List<String> arguments = new Vector<String>();
				arguments.add("--atlas-dir");
				arguments.add(locString);
				arguments.add("create");
				arguments.add("--no-config");
				arguments.add(locString);
				main.execute(globalSettings, arguments);
			}
			
			// Configure project
			{
				List<String> arguments = new Vector<String>();
				arguments.add("--atlas-dir");
				arguments.add(locString);
				arguments.add("config");

				TestConfiguration testConfig = new TestConfiguration();
				testConfig.setCouchDbUrlStr(testProperties.getProperty("couchdb.server"));
				testConfig.setCouchDbName(couchDbName);
				testConfig.setCouchDbAdminUser(testProperties.getProperty("couchdb.user"));
				testConfig.setCouchDbAdminPassword(testProperties.getProperty("couchdb.password"));
				globalSettings.setInReader( testConfig.getUserInputReader() );
				
				main.execute(globalSettings, arguments);
			}
			
			// Update project
			{
				List<String> arguments = new Vector<String>();
				arguments.add("--atlas-dir");
				arguments.add(locString);
				arguments.add("update");
				
				main.execute(globalSettings, arguments);
			}
			
			CouchDb couchDb = couchClient.getDatabase(couchDbName);
			SkeletonDocumentsDetector docFinder = new SkeletonDocumentsDetector(couchDb, globalSettings);
			List<String> docIds = docFinder.getSkeletonDocIds();
			if( docIds.size() < 1 ){
				fail("Unable to find any skeleton documents");
			}
		}
	}
}
