package ca.carleton.gcrc.couch.config.listener;

import java.io.File;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import junit.framework.TestCase;

public class CouchConfigFactoryTest extends TestCase {

	public void testRetrieveConfigurationObject() throws Exception {
		CouchDb db = TestUtils.getTestCouchDb();
		if( null != db ) {
			CouchDesignDocument dd = db.getDesignDocument("config");

			CouchConfigFactory factory = new CouchConfigFactory();
			factory.setConfigDesign(dd);
			factory.setServerName("testRetrieveConfigurationObject");
			
			factory.createDefaultConfigurationObject();
			
			CouchConfig config = factory.retrieveConfigurationObject();
			
			if( false == factory.getServerName().equals( config.getServer() ) ) {
				fail("Invalid server name set");
			}
		}
	}

	public void testCronUpload() throws Exception {
		CouchDb db = TestUtils.getTestCouchDb();
		if( null != db ) {
			CouchDesignDocument dd = db.getDesignDocument("config");

			CouchConfigFactory factory = new CouchConfigFactory();
			factory.setConfigDesign(dd);
			factory.setServerName("testCronUpload");
			
			factory.createDefaultConfigurationObject();
			
			CouchConfig config = factory.retrieveConfigurationObject();

			File fakeFile = TestUtils.getTestFile("test.properties.example");
			config.uploadCronLogs(fakeFile);
		}
	}
}
