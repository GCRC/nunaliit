package ca.carleton.gcrc.css;

import java.io.File;
import java.io.StringWriter;

import junit.framework.TestCase;

public class MergeProcessTest extends TestCase {

	public void testGenerate() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.addInputFilePath( "a.css" );
		config.addInputFilePath( "b.css" );
		
		StringWriter sw = new StringWriter();
		
		MergeProcess mergeProcess = new MergeProcess();
		mergeProcess.generate(config, sw);
	}

	public void testGenerateToFile() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.setLicenseFile( new File(resourceDir,"license.txt") );
		config.addInputFilePath( "a.css" );
		config.addInputFilePath( "b.css" );

		File testDir = TestSupport.getTestDirectory();
		File outputFile = new File(testDir, "merged.css");
		
		MergeProcess mergeProcess = new MergeProcess();
		mergeProcess.generate(config, outputFile);
	}
}
