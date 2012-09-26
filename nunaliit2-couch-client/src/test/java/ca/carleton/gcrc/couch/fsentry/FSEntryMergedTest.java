package ca.carleton.gcrc.couch.fsentry;

import java.io.File;
import java.util.List;
import java.util.Vector;

import junit.framework.TestCase;

public class FSEntryMergedTest extends TestCase {
	
	static public List<FSEntry> getTestEntries() throws Exception {
		List<FSEntry> entries = new Vector<FSEntry>();
		for(File file : TestSupport.getTestDirectories()){
			entries.add( new FSEntryFile(file) );
		}
		return entries;
	}

	public void testName() throws Exception {
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
		String name = entry.getName();
		
		// The name should be associated with the first in list
		if( false == "dir1".equals(name) ){
			fail("Unexpected name");
		}
	}
	
	public void testExtension() throws Exception {
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
		FSEntry child = FSEntrySupport.findDescendant(entry,"f1.txt");

		if( false == "txt".equals(child.getExtension()) ){
			fail("Unexpected extension");
		}
	}
	
	public void testExists() throws Exception {
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
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
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
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
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
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
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );

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
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );

		// Child file
		{
			FSEntry child = entry.getChild("f1.txt");
			if( null == child ){
				fail("Child f1.txt is expected");
				
			} else if( false == child.isFile() ){
				fail("Expected file f1.txt");
			}
		}

		// Child file
		{
			FSEntry child = entry.getChild("f2.txt");
			if( null == child ){
				fail("Child f2.txt is expected");
				
			} else if( false == child.isFile() ){
				fail("Expected file f2.txt");
			}
		}

		// Child directory
		{
			FSEntry child = entry.getChild("d1");
			if( null == child ){
				fail("Child directory is expected");
				
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
	
	public void testMerging() throws Exception {
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
		boolean f1Found = false;
		boolean f2Found = false;
		boolean f3Found = false;
		
		for(FSEntry child : entry.getChildren()){
			if( "f1.txt".equals(child.getName()) ) {
				f1Found = true;
			} else if( "f2.txt".equals(child.getName()) ) {
				f2Found = true;
			} else if( "f3.txt".equals(child.getName()) ) {
				f3Found = true;
			}
		}
		
		if( false == f1Found ) {
			fail("f1.txt not found");
		}
		if( false == f2Found ) {
			fail("f2.txt not found");
		}
		if( false == f3Found ) {
			fail("f3.txt not found");
		}
	}
	
	public void testMergingSubDir() throws Exception {
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		FSEntry sub = FSEntrySupport.findDescendant(entry,"d1");
		
		boolean s1Found = false;
		boolean s2Found = false;
		boolean s3Found = false;
		
		for(FSEntry child : sub.getChildren()){
			if( "s1.txt".equals(child.getName()) ) {
				s1Found = true;
			} else if( "s2.txt".equals(child.getName()) ) {
				s2Found = true;
			} else if( "s3.txt".equals(child.getName()) ) {
				s3Found = true;
			}
		}
		
		if( false == s1Found ) {
			fail("s1.txt not found");
		}
		if( false == s2Found ) {
			fail("s2.txt not found");
		}
		if( false == s3Found ) {
			fail("s3.txt not found");
		}
	}
	
	public void testCollision() throws Exception {
		FSEntryMerged entry = new FSEntryMerged( getTestEntries() );
		
		int c1Count = 0;
		
		for(FSEntry child : entry.getChildren()){
			if( "c1.txt".equals(child.getName()) ) {
				++c1Count;
			}
		}
		
		if( 1 != c1Count ) {
			fail("c1.txt found: "+c1Count+" time(s)");
		}
		
		FSEntry c1 = FSEntrySupport.findDescendant(entry,"c1.txt");
		
		String content = TestSupport.readStringFromFSEntry(c1);
		
		if( false == content.equals("dir1") ){
			fail("When merging directories, the precedence should be respected");
		}
	}
}
