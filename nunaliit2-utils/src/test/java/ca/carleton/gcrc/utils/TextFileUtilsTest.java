package ca.carleton.gcrc.utils;

import java.io.File;

import junit.framework.TestCase;

public class TextFileUtilsTest extends TestCase {

	public void testStringContent() throws Exception {
		File dir = TestSupport.getTestRunDir("testStringContent");
		
		File file = new File(dir, "test.txt");
		
		String content = "this is a test\njust to see if we can read\nthe same content back";
		
		TextFileUtils.writeTextFile(file, content);
		
		String content2 = TextFileUtils.readTextFile(file);
		
		if( false == content.equals(content2) ){
			fail("Unexpected content: "+content2);
		}
	}
}
