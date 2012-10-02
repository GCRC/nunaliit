package ca.carleton.gcrc.css;

import java.io.File;
import java.net.URL;

public class TestSupport {

	static public File findTestResourcesDir() {
		URL url = TestSupport.class.getClassLoader().getResource("test.properties.example");
		File file = new File(url.getPath());
		return file.getParentFile();
	}

	static public File generateTestDirName() throws Exception {
		File testDir = findTestResourcesDir();
		File generatedDir = new File(testDir, "generated");
		
		// find name
		int count = 0;
		while(count < 10000){
			File file = new File(generatedDir,String.format("a%1$05d", count));
			if( false == file.exists() ) {
				return file;
			}
			++count;
		}
		
		throw new Exception("Testing directory is full");
	}

	static File runTimeTestDirectory = null;
	static public File getTestDirectory() throws Exception {
		if( null == runTimeTestDirectory ) {
			runTimeTestDirectory = generateTestDirName();
			runTimeTestDirectory.mkdir();
		}
		
		return runTimeTestDirectory;
	}

}
