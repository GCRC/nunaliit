package ca.carleton.gcrc.couch.onUpload.mail;

import java.io.File;
import java.io.FileInputStream;
import java.net.URL;
import java.util.Properties;

public class TestConfiguration {

	static public File getTestFile(String resourceName) {
		URL url = TestConfiguration.class.getClassLoader().getResource(resourceName);
		return new File(url.getFile());
	}
	
	static private boolean tested = false;
	static private boolean configured = false;
	static private Properties mailProperties = null;
	static public boolean isTestingConfigured() {
		if( false == tested ) {
			tested = true;
			File dir = getTestFile("mail.properties.default").getParentFile();
			File configFile = new File(dir, "mail.properties");
			if( configFile.exists() ) {
				Properties props = new Properties();
				FileInputStream fis = null;
				try {
					fis = new FileInputStream(configFile);
					props.load(fis);
					mailProperties = props;
					configured = true;
					
				} catch (Exception e) {
					// Unable to load configuration. Ignore.
				} finally {
					if( null != fis ) {
						try {
							fis.close();
						} catch (Exception e) {
							// Ignore
						}
					}
				}
			}
		}
		return configured;
	}
	
	static public Properties getMailProperties() {
		if( isTestingConfigured() ) {
			return mailProperties;
		}
		return null;
	}
}
