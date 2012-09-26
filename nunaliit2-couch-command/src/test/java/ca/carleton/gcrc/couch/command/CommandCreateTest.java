package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.util.List;
import java.util.Vector;

import junit.framework.TestCase;

public class CommandCreateTest extends TestCase {

	public void testCreationNoConfig() throws Exception {
		// Figure out a location to create the atlas
		File loc = TestSupport.generateTestDirName();

		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		List<String> arguments = new Vector<String>();

		arguments.add("--atlas-dir");
		arguments.add(loc.getAbsolutePath());
		arguments.add("create");
		arguments.add("--no-config");
		
		
		main.execute(globalSettings, arguments);
	}

	public void testCreationWithConfig() throws Exception {
		// Figure out a location to create the atlas
		File loc = TestSupport.generateTestDirName();

		GlobalSettings globalSettings = new GlobalSettings();
		Main main = new Main();
		List<String> arguments = new Vector<String>();

		arguments.add("--atlas-dir");
		arguments.add(loc.getAbsolutePath());
		arguments.add("create");
		
		
		// Create input stream
		TestConfiguration testConfig = new TestConfiguration();
		globalSettings.setInReader( testConfig.getUserInputReader() );
		
		main.execute(globalSettings, arguments);
	}
}
