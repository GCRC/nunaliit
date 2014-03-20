package ca.carleton.gcrc.json.patcher;

import org.json.JSONArray;
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

	public void testDouble() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", 5.5);
		
		Object v = obj.opt("n");
		if( false == (v instanceof Double) ){
			fail("Unexpected type returned for a double");
		}
	}

	public void testString() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", "test");
		
		Object v = obj.opt("n");
		if( false == (v instanceof String) ){
			fail("Unexpected type returned for a string");
		}
	}

	public void testObject() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", new JSONObject());
		
		Object v = obj.opt("n");
		if( false == (v instanceof JSONObject) ){
			fail("Unexpected type returned for an object");
		}
	}

	public void testArray() throws Exception {
		JSONObject obj = new JSONObject();
		obj.put("n", new JSONArray());
		
		Object v = obj.opt("n");
		if( false == (v instanceof JSONArray) ){
			fail("Unexpected type returned for an array");
		}
	}
}
