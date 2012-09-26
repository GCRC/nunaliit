package ca.carleton.gcrc.geom;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.Properties;

public class TestSupport {
	static private boolean g_propsLoaded = false;
	static private Properties g_props = null;
	static private File generatedTestDir = null;
	
	static public Properties loadProperties() throws Exception {
		if( false == g_propsLoaded ) {
			InputStream propStream = 
				TestSupport.class.getClassLoader().getResourceAsStream("test.properties");
			if( null != propStream ) {
				g_props = new Properties();
				g_props.load(propStream);
			}

			g_propsLoaded = true;
		}
		
		return g_props;
	}

	static public File findResourceFile(String name) {
		URL url = TestSupport.class.getClassLoader().getResource(name);
		File file = new File(url.getPath());
		return file;
	}

	static public File findTopTestingDir() {
		URL url = TestSupport.class.getClassLoader().getResource("test.properties.example");
		File file = new File(url.getPath());
		return file.getParentFile();
	}
	
	static public File getTestRunDir() throws Exception {
		if( null != generatedTestDir ){
			return generatedTestDir;
		}
		
		File testDir = findTopTestingDir();
		File generatedDir = new File(testDir, "generated");
		if( false == generatedDir.exists() ) {
			generatedDir.mkdir();
		}
		
		// find name
		int count = 0;
		while(count < 10000){
			File file = new File(generatedDir,String.format("a%1$05d", count));
			if( false == file.exists() ) {
				generatedTestDir = file;
				generatedTestDir.mkdir();
				return file;
			}
			++count;
		}
		
		throw new Exception("Testing directory is full");
	}
}
