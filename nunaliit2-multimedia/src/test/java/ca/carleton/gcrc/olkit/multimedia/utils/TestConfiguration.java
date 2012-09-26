package ca.carleton.gcrc.olkit.multimedia.utils;

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
	static public boolean isTestingConfigured() {
		if( false == tested ) {
			tested = true;
			URL url = TestConfiguration.class.getClassLoader().getResource("multimedia.properties");
			if( null != url ) {
				File propFile = new File(url.getFile());
				Properties props = new Properties();
				FileInputStream fis = null;
				try {
					fis = new FileInputStream(propFile);
					props.load(fis);
					MultimediaConfiguration.configureFromProperties(props);
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
}
