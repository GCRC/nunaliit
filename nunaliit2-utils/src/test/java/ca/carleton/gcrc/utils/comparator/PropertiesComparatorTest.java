package ca.carleton.gcrc.utils.comparator;

import java.util.Properties;

import junit.framework.TestCase;

public class PropertiesComparatorTest extends TestCase {

	public void testEqual(){
		// Create a test properties
		Properties props1 = new Properties();
		props1.setProperty("abc", "def");
		props1.setProperty("123", "456");

		Properties props2 = new Properties();
		props2.setProperty("abc", "def");
		props2.setProperty("123", "456");

		PropertiesComparator comp = new PropertiesComparator();
		if( 0 != comp.compare(props1, props2) ) {
			fail("Both instances of Properties should compare equal");
		}
	}

	public void testMissing(){
		// Create a test properties
		Properties props1 = new Properties();
		props1.setProperty("abc", "def");
		props1.setProperty("123", "456");

		Properties props2 = new Properties();
		props2.setProperty("abc", "def");

		PropertiesComparator comp = new PropertiesComparator();
		if( 0 == comp.compare(props1, props2) ) {
			fail("Both instances of Properties should not compare equal");
		}
	}

	public void testAugmented(){
		// Create a test properties
		Properties props1 = new Properties();
		props1.setProperty("abc", "def");

		Properties props2 = new Properties();
		props2.setProperty("abc", "def");
		props2.setProperty("123", "456");

		PropertiesComparator comp = new PropertiesComparator();
		if( 0 == comp.compare(props1, props2) ) {
			fail("Both instances of Properties should not compare equal");
		}
	}

	public void testModified(){
		// Create a test properties
		Properties props1 = new Properties();
		props1.setProperty("abc", "def");
		props1.setProperty("123", "456");

		Properties props2 = new Properties();
		props2.setProperty("abc", "def");
		props2.setProperty("123", "789");

		PropertiesComparator comp = new PropertiesComparator();
		if( 0 == comp.compare(props1, props2) ) {
			fail("Both instances of Properties should not compare equal");
		}
	}
}
