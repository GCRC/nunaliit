package ca.carleton.gcrc.couch.application;

import java.io.File;

import ca.carleton.gcrc.javascript.JavascriptRunner;
import junit.framework.TestCase;

public class ValidationTest extends TestCase {

	public void testValidation() throws Exception {
		JavascriptRunner jsRunner = null;
		try {
			jsRunner = new JavascriptRunner();
			
			File projectDir = TestSupport.findProjectDir();
			File jsFileAtlas = new File(projectDir,"src/main/atlas_couchapp/vendor/nunaliit2/atlas.js");
			File jsFileUtils = new File(projectDir,"target/nunaliit-js/nunaliit2/n2.couchUtils.js");
			File jsFileValidate = new File(projectDir,"src/main/atlas_couchapp/vendor/nunaliit2/validate.js");
			
			jsRunner.addJavascript(jsFileAtlas);
			jsRunner.addJavascript(jsFileUtils);
			jsRunner.addJavascript(jsFileValidate);

			// Load Javascript Unit Testing frameowrk
			jsRunner.addJavascript( new File(projectDir,"src/test/javascript/jsunit.js") );

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
