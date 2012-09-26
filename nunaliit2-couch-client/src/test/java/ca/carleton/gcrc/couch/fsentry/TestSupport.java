package ca.carleton.gcrc.couch.fsentry;

import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URL;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Vector;

public class TestSupport {

	static public File findResourceFile(String name) {
		URL url = TestSupport.class.getClassLoader().getResource(name);
		File file = new File(url.getPath());
		return file;
	}

	static public List<File> getTestDirectories(){
		File testFile = TestSupport.findResourceFile("test.properties.example");
		
		File topFile = new File(testFile.getParent(), "fsentry");
		
		List<File> directories = new Vector<File>();
		for(String name : topFile.list()){
			directories.add( new File(topFile,name) );
		}
		Collections.sort(directories, new Comparator<File>(){

			@Override
			public int compare(File f1, File f2) {
				return f1.getName().compareTo( f2.getName() );
			}
			
		});

		return directories;
	}

	static public File getTestDirectory(String name){
		File testFile = TestSupport.findResourceFile("test.properties.example");
		
		File topFile = new File(testFile.getParent(), "fsentry");
		
		File testDir = new File(topFile, name);
		
		return testDir;
	}

	static public String readStringFromFSEntry(FSEntry entry) throws Exception {
		InputStream is = entry.getInputStream();
		InputStreamReader isr = new InputStreamReader(is,"UTF-8");
		StringWriter sw = new StringWriter();
		int c = isr.read();
		while(c>=0){
			sw.write(c);
			c = isr.read();
		}
		sw.flush();
		is.close();
		
		String content = sw.toString();
		return content;
	}
}
