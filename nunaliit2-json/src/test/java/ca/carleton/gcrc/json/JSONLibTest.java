package ca.carleton.gcrc.json;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import junit.framework.TestCase;

public class JSONLibTest extends TestCase {

	public void testBracesInString() throws Exception {
		String test = "{\"a\":\"{b}\"}";
		JSONTokener tokener = new JSONTokener(test);
		Object obj = tokener.nextValue();
		if( obj instanceof JSONObject ){
			JSONObject jsonObj = (JSONObject)obj;
			String aStr = jsonObj.getString("a");
			if( false == "{b}".equals(aStr) ) {
				fail("Unexpected result: "+aStr);
			}
		} else {
			fail("Invalid type");
		}
	}
	
	public void testInnerObject() throws Exception {
		JSONObject obj = new JSONObject();
		{
			obj.put("a", "1");
			
			JSONObject inner = new JSONObject();
			obj.put("inner", inner);
			
			inner.put("b", "2");
		}
		
		// Verify
		if( false == "1".equals( obj.getString("a") ) ){
			fail("Basic put fails");
		}
		JSONObject innerCopy = obj.getJSONObject("inner");
		if( null == innerCopy ){
			fail("Can not get inner object");
		}
		if( false == "2".equals( innerCopy.getString("b") ) ){
			fail("Inner put not applied");
		}
	}

	public void testInnerArray() throws Exception {
		JSONObject obj = new JSONObject();
		{
			obj.put("a", "1");
			
			JSONArray inner = new JSONArray();
			obj.put("inner", inner);
			
			inner.put("1");
			inner.put("2");
		}
		
		// Verify
		if( false == "1".equals( obj.getString("a") ) ){
			fail("Basic put fails");
		}
		JSONArray innerCopy = obj.getJSONArray("inner");
		if( null == innerCopy ){
			fail("Can not get inner array");
		}
		if( false == "1".equals( innerCopy.get(0) ) ){
			fail("Inner add not applied (0)");
		}
		if( false == "2".equals( innerCopy.get(1) ) ){
			fail("Inner add not applied (1)");
		}
	}

	public void testNullString() throws Exception {
		String jsonInput = "{\"name\":null,\"roles\":[]}";
		JSONTokener jsonTokener = new JSONTokener(jsonInput);
		Object obj = jsonTokener.nextValue();
		if( obj instanceof JSONObject ) {
			JSONObject jsonObj = (JSONObject)obj;
			if( JSONSupport.containsKey(jsonObj, "name") ) {
				// OK
				boolean nameValueIsNull = jsonObj.isNull("name");
				if( nameValueIsNull ) {
					// OK
				} else {
					fail("Expected a null string");
				}
			} else {
				fail("'name' key should be reported");
			}
		} else {
			fail("Expected a JSON object: "+obj.getClass().getSimpleName());
		}
	}
}
