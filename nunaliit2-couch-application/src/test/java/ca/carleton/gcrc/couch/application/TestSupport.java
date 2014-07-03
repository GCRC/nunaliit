package ca.carleton.gcrc.couch.application;

import java.io.File;
import java.net.URL;

public class TestSupport {

	static File g_projectDir = null;
	
	synchronized static public File findProjectDir() {
		if( null == g_projectDir ) {
			URL url = TestSupport.class.getClassLoader().getResource("dummy.txt");
			File file = new File(url.getPath());
			g_projectDir = file.getParentFile().getParentFile().getParentFile();
		} 
		
		return g_projectDir;
	}
}
