package ca.carleton.gcrc.couch.app;

import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import junit.framework.TestCase;

public class DefaultFilenameFilterTest extends TestCase {

	public void testPeriod() throws Exception {
		if( false == DocumentFile.defaultFilenameFilter.accept((FSEntry)null, "test") ) {
			fail("Should accept 'test'");
		}
		if( true == DocumentFile.defaultFilenameFilter.accept((FSEntry)null, ".test") ) {
			fail("Should reject '.test'");
		}
	}

	public void testTilde() throws Exception {
		if( false == DocumentFile.defaultFilenameFilter.accept((FSEntry)null, "test") ) {
			fail("Should accept 'test'");
		}
		if( true == DocumentFile.defaultFilenameFilter.accept((FSEntry)null, "test~") ) {
			fail("Should reject 'test~'");
		}
	}
}
