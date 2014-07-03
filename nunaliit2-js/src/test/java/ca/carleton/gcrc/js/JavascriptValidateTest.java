package ca.carleton.gcrc.js;

import java.io.File;

import ca.carleton.gcrc.javascript.JavascriptRunner;
import junit.framework.TestCase;

public class JavascriptValidateTest extends TestCase {

	public void testLibrary() throws Exception {
		JavascriptRunner jsRunner = null;
		try {
			jsRunner = new JavascriptRunner();
			
			File projectDir = TestSupport.findProjectDir();

//			File jQueryFile = new File(projectDir, "target/nunaliit-js-external/js-external/js/jquery.js");
//			jsRunner.addJavascript(jQueryFile);
//			
			for(File file : TestSupport.getLibraryFileSet()){
				jsRunner.addJavascript(file);
			}

			// Load Javascript Unit Testing framework
			jsRunner.addJavascript( new File(projectDir,"target/jsunit/jsunit.js") );

			// Load test cases
			jsRunner.addJavascript( new File(projectDir,"src/test/javascript/test_cases.js") );
			
			Object result = jsRunner.evaluateJavascript("jsunit.runTests();");
			Integer testCount = JavascriptRunner.optInteger(result, "testCount");
			Integer failureCount = JavascriptRunner.optInteger(result, "failureCount");
			if( null == testCount || null == failureCount ){
				fail("Invalid test report: "+result.getClass().getName());
			} else {
				if( failureCount > 0 ){
					fail("Test failures reported: "+failureCount);
				}
			}
			
		} catch(Exception e) {
			throw e;
		} finally {
			jsRunner.cleanup();
		}
	}
}
