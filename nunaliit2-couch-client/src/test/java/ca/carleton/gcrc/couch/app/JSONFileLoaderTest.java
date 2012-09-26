package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import junit.framework.TestCase;
import org.json.JSONObject;
import org.json.JSONTokener;

public class JSONFileLoaderTest extends TestCase {

	static final private Pattern patternFileNameAndExtension = Pattern.compile("^(.*)\\.([^.]*)$");
	static final private Pattern patternFileNameAndExtraExtension = Pattern.compile("^(.*)\\.([^.]*\\.[^.]*)$");
	
	static public File findResourceDirectory(String name) {
		URL url = JSONFileLoaderTest.class.getClassLoader().getResource(name);
		File file = new File(url.getPath());
		return file;
	}
	
	public void testBuilder() throws Exception {
		File dir = findResourceDirectory("builder");
		
		// Detect tests
		Map<File,File> tests = new HashMap<File,File>();
		{
			String[] files = dir.list();
			for(String file : files) {
				Matcher faeMatcher = patternFileNameAndExtension.matcher(file);
				if( faeMatcher.matches() ) {
					String name = faeMatcher.group(1);
					String ext = faeMatcher.group(2);
					
					if( "test".equals(ext) ) {
						File testFile = new File(dir,file);
						File expectedFile = new File(dir,name+".expected.txt");
						
						if( testFile.isDirectory()
						 && expectedFile.exists()
						 && expectedFile.isFile() ) {
							tests.put(testFile, expectedFile);
						}
					}
				}
			}
		}
		
		// Run tests
		for(File testFile : tests.keySet()) {
			File expectedFile = tests.get(testFile); 
			
			perform(testFile, expectedFile);
		}
	}
	
	public void testFileBuilder() throws Exception {
		File dir = findResourceDirectory("fileBuilder");
		
		// Detect tests
		Map<File,File> tests = new HashMap<File,File>();
		{
			String[] files = dir.list();
			for(String file : files) {
				Matcher faeMatcher = patternFileNameAndExtraExtension.matcher(file);
				if( faeMatcher.matches() ) {
					String name = faeMatcher.group(1);
					String ext = faeMatcher.group(2);
					
					if( "test.txt".equals(ext) ) {
						File testFile = new File(dir,file);
						File expectedFile = new File(dir,name+".expected.txt");
						
						if( testFile.isFile()
						 && expectedFile.exists()
						 && expectedFile.isFile() ) {
							tests.put(testFile, expectedFile);
						}
					}
				}
			}
		}
		
		// Run tests
		for(File testFile : tests.keySet()) {
			File expectedFile = tests.get(testFile); 
			
			perform(testFile, expectedFile);
		}
	}
	
	public void testSingle() throws Exception {
		File dir = findResourceDirectory("builder");
		File testFile = new File(dir,"json_array.test");
		File expectedFile = new File(dir,"json_array.expected.txt");
		
		perform(testFile, expectedFile);
	}
	
	private void perform(File testFile, File expectedFile) throws Exception {
		// Build object
		String loadedString = null;
		{
			JSONFileLoader builder = new JSONFileLoader(testFile);
			StringWriter sw = new StringWriter();
			builder.write(sw);
			loadedString = sw.toString();
		}
		
		// Verify that we get JSON from it
		{
			JSONTokener jsonTokener = new JSONTokener(loadedString);
			Object obj = jsonTokener.nextValue();
			if( obj instanceof JSONObject ) {
				// OK
			} else {
				throw new Exception("Unexpected returned object type: "+obj.getClass().getSimpleName());
			}
		}
		
		// Load up expected string
		String expectedString = null;
		{
			FileInputStream fis = new FileInputStream(expectedFile);
			InputStreamReader isr = new InputStreamReader(fis,"UTF-8");
			StringWriter expectedSw = new StringWriter();
			int c = isr.read();
			while( c >= 0 ) {
				expectedSw.write(c);
				c = isr.read();
			}
			fis.close();
			expectedString = expectedSw.toString();
		}
		
		// Verify against expected string
		if( false == loadedString.equals(expectedString) ) {
			fail("Unexpected value for test ("+testFile.getName()+"): "+loadedString);
		}
	}
}
