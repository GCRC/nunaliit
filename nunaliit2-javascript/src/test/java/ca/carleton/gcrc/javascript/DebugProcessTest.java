package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.StringWriter;

import junit.framework.TestCase;

public class DebugProcessTest extends TestCase {

	public void testGenerate() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.addInputFilePath( "a.js" );
		config.addInputFilePath( "b.js" );
		
		StringWriter sw = new StringWriter();
		
		DebugProcess debugProcess = new DebugProcess();
		debugProcess.generate(config, "debug.js", sw);
	}

	public void testGenerateToFile() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.setLicenseFile( new File(resourceDir, "license.txt") );
		config.addInputFilePath( "a.js" );
		config.addInputFilePath( "b.js" );

		File testDir = TestSupport.getTestDirectory();
		File outputFile = new File(testDir, "debug.js");
		
		DebugProcess debugProcess = new DebugProcess();
		debugProcess.generate(config, outputFile);
	}
}
