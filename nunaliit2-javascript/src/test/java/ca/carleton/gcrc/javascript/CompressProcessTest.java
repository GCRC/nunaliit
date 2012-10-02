package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.StringWriter;

import junit.framework.TestCase;

public class CompressProcessTest extends TestCase {

	public void testJsCompress() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.addInputFilePath( "a.js" );
		config.addInputFilePath( "b.js" );
		
		StringWriter sw = new StringWriter();
		
		CompressProcess compressProcess = new CompressProcess();
		compressProcess.generate(config, sw);
	}

	public void testJsCompressToFile() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.setLicenseFile( new File(resourceDir, "license.txt") );
		config.addInputFilePath( "a.js" );
		config.addInputFilePath( "b.js" );

		File testDir = TestSupport.getTestDirectory();
		File outputFile = new File(testDir, "min.js");
		
		CompressProcess compressProcess = new CompressProcess();
		compressProcess.generate(config, outputFile);
	}
}
