package ca.carleton.gcrc.couch.fsentry;

import java.util.List;

import junit.framework.TestCase;

public class FSEntryResourceTest extends TestCase {

	static private ClassLoader getClassLoader(){
		return FSEntryResourceTest.class.getClassLoader();
	}
	
	public void testName() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");
		
		String name = entry.getName();
		
		// The name should be associated with the first in list
		if( false == "dir1".equals(name) ){
			fail("Unexpected name");
		}
	}
	
	public void testExtension() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");
		
		FSEntry child = FSEntrySupport.findDescendant(entry,"f1.txt");

		if( false == "txt".equals(child.getExtension()) ){
			fail("Unexpected extension");
		}
	}
	
	public void testExists() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");
		
		// Test something that exists
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"f1.txt");
			if( false == child.exists() ){
				fail("f1.txt should be found");
			}
		}
		
		// Test something that does not exists
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"doesnotex.ist");
			if( null != child ){
				fail("doesnotex.ist should not be found");
			}
		}
	}
	
	public void testIsFile() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");
		
		// Test a file that exists
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"f1.txt");
			if( false == child.isFile() ){
				fail("f1.txt should be reported as a file");
			}
		}
		
		// Test a directory that exists
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"d1");
			if( true == child.isFile() ){
				fail("d1 should not be reported as a file");
			}
		}
	}
	
	public void testIsDirectory() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");
		
		// Test a directory that exists
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"d1");
			if( false == child.isDirectory() ){
				fail("d1 should be reported as a directory");
			}
		}
		
		// Test a file that exists
		{
			FSEntry child = FSEntrySupport.findDescendant(entry,"f1.txt");
			if( true == child.isDirectory() ){
				fail("f1.txt should not be reported as a directory");
			}
		}
	}
	
	public void testGetChildren() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");

		List<FSEntry> children = entry.getChildren(new FSEntryNameFilter() {
			@Override
			public boolean accept(FSEntry parent, String name) {
				if( "f1.txt".equals(name) ) {
					return false;
				}
				return true;
			}
		});
		
		// Check that f1.txt was filtered out
		for(FSEntry child : children){
			if( "f1.txt".equals(child.getName()) ){
				fail("f1.txt should have been filtered out");
			}
		}
	}
	
	public void testGetChild() throws Exception {
		FSEntryResource entry = FSEntryResource.create(getClassLoader(), "fsentry/dir1");

		// Child file
		{
			FSEntry child = entry.getChild("f1.txt");
			if( null == child ){
				fail("Child is expected");
				
			} else if( false == child.isFile() ){
				fail("Expected a file");
			}
		}

		// Child directory
		{
			FSEntry child = entry.getChild("d1");
			if( null == child ){
				fail("Child is expected");
				
			} else if( false == child.isDirectory() ){
				fail("Expected a directory");
			}
		}

		// Non-existant child
		{
			FSEntry child = entry.getChild("dummy");
			if( null != child ){
				fail("Child is not expected");
			}
		}
	}
	
	public void testPositionedResourceDirect() throws Exception {
		
		FSEntry positioned = FSEntryResource.getPositionedResource("aaa", getClassLoader(), "fsentry/dir1");
		
		if( false == "aaa".equals(positioned.getName()) ) {
			fail("Name not expected: "+positioned.getName());
		}
		if( false == positioned.isDirectory() ) {
			fail("Directory expected");
		}
		if( null == FSEntrySupport.findDescendant(positioned, "f1.txt") ){
			fail("Can not find direct descendant");
		}
		if( null == FSEntrySupport.findDescendant(positioned, "d1/s1.txt") ){
			fail("Can not find descendant");
		}
	}
	
	public void testPositionedResourcePath() throws Exception {

		FSEntry positioned = FSEntryResource.getPositionedResource("a/b/c", getClassLoader(), "fsentry/dir1");
		
		if( false == "a".equals(positioned.getName()) ) {
			fail("Name not expected: "+positioned.getName());
		}
		if( false == positioned.isDirectory() ) {
			fail("Directory expected");
		}
		if( null == FSEntrySupport.findDescendant(positioned, "b/c/f1.txt") ){
			fail("Can not find direct descendant");
		}
		if( null == FSEntrySupport.findDescendant(positioned, "b/c/d1/s1.txt") ){
			fail("Can not find descendant");
		}
	}
}
