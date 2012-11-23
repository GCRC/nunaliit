package ca.carleton.gcrc.utils;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.Properties;

import junit.framework.TestCase;
import ca.carleton.gcrc.utils.comparator.PropertiesComparator;

public class PropertiesWriterTest extends TestCase {

	public void testWrite() throws Exception {
		// Create a test properties
		Properties props = new Properties();
		props.setProperty("abc", "def");
		props.setProperty("123", "456");
		
		// Save properties
		StringWriter sw  = new StringWriter();
		PropertiesWriter propWriter = new PropertiesWriter(sw);
		propWriter.write(props);
		
		// Read back in properties
		StringReader sr = new StringReader(sw.toString());
		Properties propCopy = new Properties();
		propCopy.load(sr);
		
		// Compare both
		PropertiesComparator comp = new PropertiesComparator();
		if( 0 != comp.compare(props, propCopy) ) {
			fail("Properties not saved correctly");
		}
	}
}
