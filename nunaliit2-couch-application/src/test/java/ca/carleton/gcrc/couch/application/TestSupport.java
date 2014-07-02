package ca.carleton.gcrc.couch.application;

import java.io.File;
import java.net.URL;

public class TestSupport {

	static public File findProjectDir() {
		URL url = TestSupport.class.getClassLoader().getResource("dummy.txt");
		File file = new File(url.getPath());
		return file.getParentFile().getParentFile().getParentFile();
	}
}
