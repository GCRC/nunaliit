package ca.carleton.gcrc.couch.app;

import org.json.JSONObject;

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
}
