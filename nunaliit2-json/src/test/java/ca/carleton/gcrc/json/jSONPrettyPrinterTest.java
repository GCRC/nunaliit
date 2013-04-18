package ca.carleton.gcrc.json;

import java.io.StringWriter;

import junit.framework.TestCase;

import org.json.JSONArray;
import org.json.JSONObject;

public class jSONPrettyPrinterTest extends TestCase {

	public void testNull() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint(null);
		
		if( false == "null".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testTrue() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint(Boolean.TRUE);
		
		if( false == "true".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testFalse() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint(Boolean.FALSE);
		
		if( false == "false".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testInteger() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint( new Integer(42) );
		
		if( false == "42".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testDouble() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint( new Double(1.25) );
		
		if( false == "1.25".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testString() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint( "abc" );
		
		if( false == "\"abc\"".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testEscapedString() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint( "123\"456" );
		
		if( false == "\"123\\\"456\"".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testEmptyObject() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint( new JSONObject() );
		
		if( false == "{}".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testObjectOneElement() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("a", "abc");
		
		pp.prettyPrint( jsonObject );
		
		if( false == "{\n\t\"a\":\"abc\"\n}".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testObjectTwoElements() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("a", 1);
		jsonObject.put("b", 2);
		
		pp.prettyPrint( jsonObject );
		
		if( false == "{\n\t\"a\":1\n\t,\"b\":2\n}".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testObjectInnerObject() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		
		JSONObject jsonObject = new JSONObject();
		JSONObject inner1 = new JSONObject();
		JSONObject inner2 = new JSONObject();
		inner1.put("b", 1);
		inner1.put("c", inner2);
		jsonObject.put("a", inner1);
		
		pp.prettyPrint( jsonObject );
		
		if( false == "{\n\t\"a\":{\n\t\t\"b\":1\n\t\t,\"c\":{}\n\t}\n}".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testEmptyArray() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		pp.prettyPrint( new JSONArray() );
		
		if( false == "[]".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testArrayOneElement() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		
		JSONArray jsonArray = new JSONArray();
		jsonArray.put("abc");
		
		pp.prettyPrint( jsonArray );
		
		if( false == "[\n\t\"abc\"\n]".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testArrayTwoElements() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(1);
		jsonArray.put(2);
		
		pp.prettyPrint( jsonArray );
		
		if( false == "[\n\t1\n\t,2\n]".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}

	public void testArrayInnerArray() throws Exception {
		StringWriter sw = new StringWriter();
		JSONPrettyPrinter pp = new JSONPrettyPrinter(sw);
		
		JSONArray jsonArray = new JSONArray();
		JSONArray inner1 = new JSONArray();
		JSONArray inner2 = new JSONArray();
		inner1.put(1);
		inner1.put(inner2);
		jsonArray.put(inner1);
		
		pp.prettyPrint( jsonArray );
		
		if( false == "[\n\t[\n\t\t1\n\t\t,[]\n\t]\n]".equals(sw.toString()) ){
			fail("Unexpected value: "+sw.toString());
		}
	}
}
