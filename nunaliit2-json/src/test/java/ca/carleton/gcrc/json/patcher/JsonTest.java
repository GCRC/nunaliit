package ca.carleton.gcrc.json.patcher;

import org.json.JSONObject;

import junit.framework.TestCase;

public class JsonTest extends TestCase {

	public void testNull() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", (Object)null);
		
		Object v = obj.opt("n");
		if( v != null ){
			fail("Unexpected type returned for null");
		}
	}

	public void testInt() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", 5);
		
		Object v = obj.opt("n");
		if( false == (v instanceof Integer) ){
			fail("Unexpected type returned for an integer");
		}
	}

	public void testLong() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", (long)5);
		
		Object v = obj.opt("n");
		if( false == (v instanceof Long) ){
			fail("Unexpected type returned for a long");
		}
	}
}
