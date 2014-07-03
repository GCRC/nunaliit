package ca.carleton.gcrc.js;

import java.io.File;
import java.net.URL;
import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.javascript.LibraryConfiguration;

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
	
	static public List<File> getLibraryFileSet() throws Exception {
		List<File> result = new Vector<File>();
		
		File projectDir = findProjectDir();
		
		// nunaliit2-test.js
		{
			LibraryConfiguration conf = new LibraryConfiguration();
			conf.setSourceDirectory(new File(projectDir, "src/main/js/nunaliit2"));
			conf.parseConfiguration(new File(projectDir, "compress/nunaliit2-test.cfg"));
			List<File> libFiles = conf.getInputFiles();
			result.addAll(libFiles);
		}
		
//		// nunaliit2.js
//		{
//			LibraryConfiguration conf = new LibraryConfiguration();
//			conf.setSourceDirectory(new File(projectDir, "src/main/js/nunaliit2"));
//			conf.parseConfiguration(new File(projectDir, "compress/nunaliit2.cfg"));
//			List<File> libFiles = conf.getInputFiles();
//			result.addAll(libFiles);
//		}
//		
//		// nunaliit2-couch.js
//		{
//			LibraryConfiguration conf = new LibraryConfiguration();
//			conf.setSourceDirectory(new File(projectDir, "src/main/js/nunaliit2"));
//			conf.parseConfiguration(new File(projectDir, "compress/nunaliit2-couch.cfg"));
//			List<File> libFiles = conf.getInputFiles();
//			result.addAll(libFiles);
//		}
		
		return result;
	}
}
