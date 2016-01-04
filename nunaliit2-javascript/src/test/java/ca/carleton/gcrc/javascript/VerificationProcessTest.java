package ca.carleton.gcrc.javascript;

import java.io.File;

import junit.framework.TestCase;

public class VerificationProcessTest extends TestCase {

	public void testValid() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.addInputFilePath( "a.js" );
		
		ClosureCompilerAdaptor verifyProcess = new ClosureCompilerAdaptor();
		verifyProcess.verifyFiles(config);
	}

	public void testDuplicate() throws Exception {
		File resourceDir = TestSupport.findTestResourcesDir();
		
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory(resourceDir);
		config.addInputFilePath( "invalid_duplicate.js" );
		
		try {
			ClosureCompilerAdaptor verifyProcess = new ClosureCompilerAdaptor();
			verifyProcess.verifyFiles(config);
			
			fail("Error should be reported");
		} catch(Exception e) {
			// OK
		}
	}
	
}
