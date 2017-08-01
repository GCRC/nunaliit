package ca.carleton.gcrc.utils;

import java.io.File;
import java.net.URL;

public class TestSupport {
	
	static private File generatedTestDir = null;
	
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
		if( !generatedDir.exists() ){
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

	static public File getTestRunDir(String name) throws Exception {
		File generatedDir = getTestRunDir();
		
		File namedDir = new File(generatedDir, name);
		
		if( false == namedDir.exists() ){
			namedDir.mkdir();
		}
		
		return namedDir;
	}

}
