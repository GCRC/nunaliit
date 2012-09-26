package ca.carleton.gcrc.couch.fsentry;

import junit.framework.TestCase;

public class FSEntrySupportTest extends TestCase {

	public void testFindDescendant() throws Exception {
		FSEntryFile entry = new FSEntryFile( TestSupport.getTestDirectory("dir1") );

		// Check direct descendant
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"f1.txt");
			if( null == child ){
				fail("Unable to reach direct descendant");
			}
		}

		// Check descendant hierarchy
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"d1/s1.txt");
			if( null == child ){
				fail("Unable to reach descendant hierarchy");
			}
		}

		// null name
		try {
			FSEntrySupport.findDescendant(entry,null);
			
			fail("null child name should raise an exception");
			
		} catch( Exception e ){
			// OK
		}

		// check absolute path
		try {
			FSEntrySupport.findDescendant(entry,"/test.txt");
			
			fail("absolute path should raise an exception");
			
		} catch( Exception e ){
			// OK
		}
	}
}
