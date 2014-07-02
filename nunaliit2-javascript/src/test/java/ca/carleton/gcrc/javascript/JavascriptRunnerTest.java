package ca.carleton.gcrc.javascript;

import java.util.List;

import junit.framework.TestCase;

public class JavascriptRunnerTest extends TestCase {

	public void testOptArray() throws Exception {
		JavascriptRunner runner = null;
		try {
			runner = new JavascriptRunner();
			
			Object o = runner.evaluateJavascript("(function(){ return {arr:['a',null,1]}; })();");
			List<?> arr = JavascriptRunner.optArray(o, "arr");
			
			if( null == arr ){
				fail("Expected a list");
			} else {
				assertEquals(3, arr.size());
				
				if( false == "a".equals( arr.get(0) ) ){
					fail("Expected first argument to be string 'a'");
				}
				if( null != arr.get(1) ){
					fail("Expected second argument to be null");
				}
				if( (new Integer(1)).equals(arr.get(2)) ){
					fail("Expected third argument to be 1");
				}
			}
			
		} catch(Exception e) {
			throw e;
		} finally {
			if( null != runner ){
				runner.cleanup();
				runner = null;
			}
		}
	}
}
