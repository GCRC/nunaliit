package ca.carleton.gcrc.couch.app;

import java.io.StringReader;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.JSONObjectConverter;
import ca.carleton.gcrc.json.JSONObjectComparator;
import junit.framework.TestCase;

public class JSONObjectConverterTest extends TestCase {

	public void testIgnoreKeysByType() throws Exception {
		JSONObject source = new JSONObject();
		{
			source.put("_id", "abcdef");

			JSONObject date = new JSONObject();
			source.put("test", date);
			date.put("nunaliit_type", "date");
			date.put("date", "1930");
			date.put("index", 5);
		}

		JSONObject expected = new JSONObject();
		{
			expected.put("_id", "abcdef");

			JSONObject date = new JSONObject();
			expected.put("test", date);
			date.put("nunaliit_type", "date");
			date.put("date", "1930");
		}
		
		JSONObjectConverter converter = new JSONObjectConverter();
		converter.addIgnoredKeyByType("date", "index");
		
		JSONObject target = converter.convertObject(source);
		
		if( 0 != JSONObjectComparator.singleton.compare(expected, target) ){
			fail("Unexpected result");
		}
	}

	public void testTrue() throws Exception {
		StringReader sr = new StringReader("true");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof Boolean ) {
			Boolean value = (Boolean)obj;
			if( !value.booleanValue() ) {
				fail("Expected true. Got false");
			}
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testTrueNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" true ");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof Boolean ) {
			Boolean value = (Boolean)obj;
			if( !value.booleanValue() ) {
				fail("Expected true. Got false");
			}
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testFalse() throws Exception {
		StringReader sr = new StringReader("false");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof Boolean ) {
			Boolean value = (Boolean)obj;
			if( value.booleanValue() ) {
				fail("Expected false. Got true");
			}
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testFalseNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" false  ");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof Boolean ) {
			Boolean value = (Boolean)obj;
			if( value.booleanValue() ) {
				fail("Expected false. Got true");
			}
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testObject() throws Exception {
		StringReader sr = new StringReader("{}");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof JSONObject ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testObjectNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" {   } ");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof JSONObject ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testArray() throws Exception {
		StringReader sr = new StringReader("[]");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof JSONArray ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testArrayNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" [   ]  ");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof JSONArray ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testNull() throws Exception {
		StringReader sr = new StringReader("null");

		Object obj = DocumentFile.readJson(sr);
		
		if( null == obj ) {
			// OK
		} else if( JSONObject.NULL == obj ) {
			// OK
		} else {
			fail("Expected null. Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testNullNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" null  ");

		Object obj = DocumentFile.readJson(sr);
		
		if( null == obj ) {
			// OK
		} else if( JSONObject.NULL == obj ) {
			// OK
		} else {
			fail("Expected null. Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testNumber() throws Exception {
		StringReader sr = new StringReader("1.5");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof Number ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testNumberNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" 1.5  ");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof Number ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testString() throws Exception {
		StringReader sr = new StringReader("\"apple\"");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof String ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testStringNotTrimmed() throws Exception {
		StringReader sr = new StringReader(" \"apple\"  ");

		Object obj = DocumentFile.readJson(sr);
		
		if( obj instanceof String ) {
			// OK
			
		} else {
			fail("Unexpected class: "+obj.getClass().getSimpleName());
		}
	}

	public void testValid() throws Exception {
		checkValid("0");
		checkValid("23");
		checkValid("23.5");
		checkValid("null");
		checkValid("true");
		checkValid("false");
		checkValid("{}");
		checkValid("{\"a\":1}");
		checkValid("[]");
		checkValid("[1,2]");
		checkValid("\n\n[1,2]\n\n");
	}
	
	private void checkValid(String testStr) throws Exception {

		try {
			StringReader sr = new StringReader(testStr);
			DocumentFile.readJson(sr);

		} catch (Exception e) {
			throw new Exception("Error on test: "+testStr, e);
		}
	}

	public void testErrors() throws Exception {
		checkError(" { \"a\":1 }  4 ");
		checkError("null \"a\"");
		checkError("1 2");
		checkError("{} true");
	}
	
	private void checkError(String testStr) throws Exception {

		try {
			StringReader sr = new StringReader(testStr);
			DocumentFile.readJson(sr);
			
			fail("Error should be triggered: "+testStr);

		} catch (Exception e) {
			// OK
		}
	}
}
