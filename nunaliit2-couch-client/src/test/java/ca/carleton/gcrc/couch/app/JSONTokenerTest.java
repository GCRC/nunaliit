package ca.carleton.gcrc.couch.app;

import java.io.StringReader;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import junit.framework.TestCase;

public class JSONTokenerTest extends TestCase {

	public void testValid() throws Exception {
		checkValid("0",Number.class);
		checkValid(" 0  ",Number.class);
		checkValid("23",Number.class);
		checkValid("23.5",Number.class);
		checkValid(" 23.5  ",Number.class);
		checkValid("null",null);
		checkValid(" null  ",null);
		checkValid("true",Boolean.class);
		checkValid(" true\n",Boolean.class);
		checkValid("false",Boolean.class);
		checkValid("\nfalse  ",Boolean.class);
		checkValid("{}",JSONObject.class);
		checkValid(" {}  ",JSONObject.class);
		checkValid("{\"a\":1}",JSONObject.class);
		checkValid(" {\"a\":1}  ",JSONObject.class);
		checkValid("[]",JSONArray.class);
		checkValid(" []  ",JSONArray.class);
		checkValid("[1,2]",JSONArray.class);
		checkValid("\n\n[1,2]\n\n",JSONArray.class);
	}

	public void testErrors() throws Exception {
		// Check that stream can detect that a value is found after
		// the first one
		checkError(" { \"a\":1 }  4 ");
		checkError("null \"a\"");
		checkError("{} true");
	}

	private Object checkValid(String testStr, Class<?> aClass) throws Exception {

		try {

			Object result = nextValue(testStr);

			// Check class of object returned
			if( null == aClass ) {
				if( null == result ) {
					// OK
				} else if( JSONObject.NULL == result ) {
					// OK
				} else {
					throw new Exception("Unexpected class: "+result.getClass().getSimpleName());
				}
			} else {
				if( null == result ) {
					throw new Exception("Unexpected null result");
				} else if( aClass.isAssignableFrom(result.getClass()) ) {
					// OK
				} else {
					throw new Exception("Unexpected class: "+result.getClass().getSimpleName());
				}
			}
			
			return result;

		} catch (Exception e) {
			throw new Exception("Error on test: "+testStr, e);
		}
	}
	
	private void checkError(String testStr) throws Exception {

		try {
			nextValue(testStr);
			
			fail("Error should be triggered: "+testStr);

		} catch (Exception e) {
			// OK
		}
	}
	
	/**
	 * Verifies that JSONTokener can read a stream that contains a value. After
	 * the reading is done, check that the stream is left in the correct state
	 * by reading the characters after. All valid cases should reach end of stream.
	 * @param testStr
	 * @return
	 * @throws Exception
	 */
	private Object nextValue(String testStr) throws Exception {
		StringReader sr = new StringReader(testStr);
		JSONTokener tokener = new JSONTokener(sr);

		Object result = tokener.nextValue();

		char c = tokener.nextClean();
		if( 0 != c ) {
			throw new Exception("Unexpected character found at end of JSON stream: "+c+ " ("+tokener+")");
		}

		sr.close();

		return result;
	}
}
