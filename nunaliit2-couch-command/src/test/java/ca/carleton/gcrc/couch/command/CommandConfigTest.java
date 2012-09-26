package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;

import junit.framework.TestCase;

public class CommandConfigTest extends TestCase {

	final static public String ATLAS_NAME = "atlas";
	final static public String COUCHDB_URL_STR = "http://127.0.0.1:5984/";
	final static public String COUCHDB_DB_NAME = "dbname";
	final static public String COUCHDB_DB_ADMIN_USER = "admin";
	final static public String COUCHDB_DB_ADMIN_PW = "adminpw";

	public void testConfig() throws Exception {
		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		
		// Figure out testing location
		File loc = TestSupport.generateTestDirName();
		String locString = loc.getAbsolutePath();

		// Create
		{
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("create");
			arguments.add("--no-config");
			arguments.add(locString);
			main.execute(globalSettings, arguments);
		}
		
		// Config
		{
			List<String> arguments = new Vector<String>();
			arguments.add("config");
			arguments.add(locString);
			
			// Create input stream
			TestConfiguration testConfig = new TestConfiguration();
			globalSettings.setInReader( testConfig.getUserInputReader() );
			
			main.execute(globalSettings, arguments);
		}
		
		// Verify that the properties were written correctly
		AtlasProperties atlasProps = AtlasProperties.fromAtlasDir(loc);
		if( false == ATLAS_NAME.equals(atlasProps.getAtlasName()) ){
			fail("Atlas name not set correctly");
		}
		if( false == COUCHDB_URL_STR.equals(atlasProps.getCouchDbUrl().toExternalForm()) ){
			fail("CouchDB URL not set correctly");
		}
		if( false == COUCHDB_DB_NAME.equals(atlasProps.getCouchDbName()) ){
			fail("CouchDB DB name not set correctly");
		}
	}

	public void testPrematureEndOfInputStream() throws Exception {
		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		
		// Figure out testing location
		File loc = TestSupport.generateTestDirName();
		String locString = loc.getAbsolutePath();

		// Create
		{
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("create");
			arguments.add("--no-config");
			main.execute(globalSettings, arguments);
		}
		
		// Config
		try {
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("config");
			
			// Create input stream
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println(ATLAS_NAME);
			pw.flush();
			StringReader sr = new StringReader(sw.toString());
			globalSettings.setInReader(sr);
			
			
			main.execute(globalSettings, arguments);
			
			fail("Unable to detect premature end of input stream");
			
		} catch(Exception e){
			// OK
		}
	}

	public void testInvalidAtlasName() throws Exception {
		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		
		// Figure out testing location
		File loc = TestSupport.generateTestDirName();
		String locString = loc.getAbsolutePath();

		// Create
		{
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("create");
			arguments.add("--no-config");
			main.execute(globalSettings, arguments);
		}
		
		// Config
		try {
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("config");

			// Create input stream
			TestConfiguration testConfig = new TestConfiguration();
			testConfig.setAtlasName("invalid atlas name");
			globalSettings.setInReader( testConfig.getUserInputReader() );
			
			main.execute(globalSettings, arguments);
			
			fail("Error detecting invalid input");
			
		} catch(Exception e) {
			// OK
		}
	}

	public void testInvalidCouchDbUrl() throws Exception {
		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		
		// Figure out testing location
		File loc = TestSupport.generateTestDirName();
		String locString = loc.getAbsolutePath();

		// Create
		{
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("create");
			arguments.add("--no-config");
			main.execute(globalSettings, arguments);
		}
		
		// Config
		try {
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("config");
			
			// Create input stream
			TestConfiguration testConfig = new TestConfiguration();
			testConfig.setCouchDbUrlStr("not.a valid url");
			globalSettings.setInReader( testConfig.getUserInputReader() );
			
			main.execute(globalSettings, arguments);
			
			fail("Error detecting invalid input");
			
		} catch(Exception e) {
			// OK
		}
	}

	public void testInvalidCouchDbName() throws Exception {
		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		
		// Figure out testing location
		File loc = TestSupport.generateTestDirName();
		String locString = loc.getAbsolutePath();

		// Create
		{
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("create");
			arguments.add("--no-config");
			main.execute(globalSettings, arguments);
		}
		
		// Config
		try {
			List<String> arguments = new Vector<String>();
			arguments.add("--atlas-dir");
			arguments.add(locString);
			arguments.add("config");
			
			// Create input stream
			TestConfiguration testConfig = new TestConfiguration();
			testConfig.setCouchDbName("NotAValidDbName");
			globalSettings.setInReader( testConfig.getUserInputReader() );
			
			main.execute(globalSettings, arguments);
			
			fail("Error detecting invalid input");
			
		} catch(Exception e) {
			// OK
		}
	}
}
