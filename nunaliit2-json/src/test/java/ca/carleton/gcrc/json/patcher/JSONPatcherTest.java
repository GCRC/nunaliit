package ca.carleton.gcrc.json.patcher;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;
import junit.framework.TestCase;

public class JSONPatcherTest extends TestCase {

	public void testNullPatch() throws Exception {
		JSONObject obj1 = new JSONObject();
		JSONObject obj2 = new JSONObject();
		
		JSONObject patch = JSONPatcher.computePatch(obj1, obj2);
		if( patch != null ) {
			fail("Expected null");
		}
	}

	public void testEquality() throws Exception {
		JSONObject obj1 = new JSONObject();
		
		obj1.put("s", "test");
		obj1.put("i", 1);
		obj1.put("l", (long)5);
		obj1.put("d", (double)1.1);
		obj1.put("n", JSONObject.NULL);
		obj1.put("b", true);
		
		JSONArray arr1 = new JSONArray();
		obj1.put("a", arr1);
		
		arr1.put("what");
		arr1.put(2);
		arr1.put((long)6);
		arr1.put((double)2.2);
		arr1.put(JSONObject.NULL);
		arr1.put(false);
		
		JSONObject obj2 = new JSONObject();
		arr1.put(obj2);

		obj2.put("s", "if");
		obj2.put("i", 3);
		obj2.put("l", (long)7);
		obj2.put("d", (double)3.3);
		obj2.put("n", JSONObject.NULL);
		obj2.put("b", false);

		JSONObject obj3 = new JSONObject();
		obj1.put("o", obj3);

		obj3.put("s", "until");
		obj3.put("i", 4);
		obj3.put("l", (long)8);
		obj3.put("d", (double)4.4);
		obj3.put("n", JSONObject.NULL);
		obj3.put("b", true);
		
		JSONArray arr2 = new JSONArray();
		obj3.put("a", arr2);
		
		arr2.put("why");
		arr2.put(5);
		arr2.put((long)9);
		arr2.put((double)5.5);
		arr2.put(JSONObject.NULL);
		arr2.put(true);
		
		JSONObject copy = JSONSupport.copyObject(obj1);
		
		JSONObject patch = JSONPatcher.computePatch(obj1, copy);
		if( patch != null ) {
			fail("Expected null");
		}
	}
	
	public void testAddArray() throws Exception {
		performTest("{}","{\"a\":[0,1]}");
	}
	
	public void testRemoveArray() throws Exception {
		performTest("{\"a\":[0,1]}","{}");
	}
	
	public void testShrinkArray() throws Exception {
		performTest("{\"a\":[0,1,2,3]}","{\"a\":[0,1]}");
	}
	
	public void testGrowArray() throws Exception {
		performTest("{\"a\":[0,1]}","{\"a\":[0,1,2,3]}");
	}
	
	public void testAddObject() throws Exception {
		performTest("{}","{\"a\":{\"b\":1}}");
	}
	
	public void testRemoveObject() throws Exception {
		performTest("{\"a\":{\"b\":1}}","{}");
	}
	
	public void testArrayToObject() throws Exception {
		performTest("{\"a\":[0,1]}","{\"a\":{\"b\":2}}");
		performTest("{\"a\":[1,[0,1],2]}","{\"a\":[1,{\"b\":2},2]}");
	}
	
	public void testObjectToArray() throws Exception {
		performTest("{\"a\":{\"b\":2}}","{\"a\":[0,1]}");
		performTest("{\"a\":[1,{\"b\":2},2]}","{\"a\":[1,[0,1],2]}");
	}
	
	public void testObjectToPrimitive() throws Exception {
		performTest("{\"a\":{\"b\":2}}","{\"a\":null}");
		performTest("{\"a\":{\"b\":2}}","{\"a\":1}");
		performTest("{\"a\":{\"b\":2}}","{\"a\":1.5}");
		performTest("{\"a\":{\"b\":2}}","{\"a\":\"test\"}");
		performTest("{\"a\":{\"b\":2}}","{\"a\":true}");
	}
	
	public void testPrimitiveToObject() throws Exception {
		performTest("{\"a\":null}","{\"a\":{\"b\":2}}");
		performTest("{\"a\":1}","{\"a\":{\"b\":2}}");
		performTest("{\"a\":1.5}","{\"a\":{\"b\":2}}");
		performTest("{\"a\":\"test\"}","{\"a\":{\"b\":2}}");
		performTest("{\"a\":true}","{\"a\":{\"b\":2}}");
	}
	
	public void testArrayToPrimitive() throws Exception {
		performTest("{\"a\":[0,1]}","{\"a\":null}");
		performTest("{\"a\":[0,1]}","{\"a\":1}");
		performTest("{\"a\":[0,1]}","{\"a\":1.5}");
		performTest("{\"a\":[0,1]}","{\"a\":\"test\"}");
		performTest("{\"a\":[0,1]}","{\"a\":true}");
	}
	
	public void testPrimitiveToArray() throws Exception {
		performTest("{\"a\":null}","{\"a\":[0,1]}");
		performTest("{\"a\":1}","{\"a\":[0,1]}");
		performTest("{\"a\":1.5}","{\"a\":[0,1]}");
		performTest("{\"a\":\"test\"}","{\"a\":[0,1]}");
		performTest("{\"a\":true}","{\"a\":[0,1]}");
	}
	
	public void testReservedKeys() throws Exception {
		performTest("{\"_rev\":\"1-1234\"}","{\"_rev\":\"2-2345\"}");
		performTest("{\"_r\":\"abc\"}","{\"_r\":\"def\"}");
		performTest("{\"_s\":1}","{\"_s\":2}");
	}
	
	private void performTest(String prevStr, String nextStr) throws Exception {
		JSONObject prev = new JSONObject(prevStr);
		JSONObject next = new JSONObject(nextStr);
		
		performTest(prev, next);
	}
	
	private void performTest(JSONObject prev, JSONObject next) throws Exception {
		JSONObject patch = JSONPatcher.computePatch(prev, next);
		JSONObject up = JSONSupport.copyObject(prev);
		JSONPatcher.applyPatch(up, patch);
		
		boolean equal = (0 == JSONSupport.compare(next, up));
		if( !equal ){
			fail("Error during patching test");
		}
	}
}
