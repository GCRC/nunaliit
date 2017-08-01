package ca.carleton.gcrc.couch.onUpload.inReach;

import java.io.File;

import ca.carleton.gcrc.couch.onUpload.TestSupport;
import junit.framework.TestCase;

public class InReachSettingsFromXmlFileTest extends TestCase {

	public void testLoad() throws Exception {
		File xmlFile = TestSupport.findResourceFile("inreach_forms.xml");
		InReachSettingsFromXmlFile settings = new InReachSettingsFromXmlFile(xmlFile);
		settings.load();
	}
}
