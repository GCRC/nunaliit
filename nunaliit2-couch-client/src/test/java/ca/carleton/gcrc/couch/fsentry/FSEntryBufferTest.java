package ca.carleton.gcrc.couch.fsentry;

import junit.framework.TestCase;

public class FSEntryBufferTest extends TestCase {

	public void testGetName() throws Exception {
		FSEntryBuffer entry = new FSEntryBuffer("name","content");
		if( false == "name".equals(entry.getName()) ) {
			fail("Invalid name");
		}
	}
	
	public void testExtension() throws Exception {
		FSEntryBuffer entry = new FSEntryBuffer("test.abc","content");
		
		if( false == "abc".equals(entry.getExtension()) ){
			fail("Unexpected extension");
		}
	}
	
	public void testExists() throws Exception {
		FSEntryBuffer entry = new FSEntryBuffer("test.abc","content");
		
		if( false == entry.exists() ){
			fail("Buffers always exist");
		}
	}
	
	public void testIsFile() throws Exception {
		FSEntryBuffer entry = new FSEntryBuffer("test.abc","content");
		
		if( false == entry.isFile() ){
			fail("Buffer is always a file");
		}
	}
	
	public void testIsDirectory() throws Exception {
		FSEntryBuffer entry = new FSEntryBuffer("test.abc","content");
		
		if( true == entry.isDirectory() ){
			fail("Buffer is never a directory");
		}
	}

	public void testGetInputStream() throws Exception {
		FSEntryBuffer entry = new FSEntryBuffer("name","content");
		String content = TestSupport.readStringFromFSEntry(entry);
		if( false == "content".equals(content) ){
			fail("Invalid content");
		}
	}

	public void testGetInputStreamBytes() throws Exception {
		byte[] b = {'a','b','c'};
		FSEntryBuffer entry = new FSEntryBuffer("name",b);
		String content = TestSupport.readStringFromFSEntry(entry);
		if( false == "abc".equals(content) ){
			fail("Invalid content");
		}
	}
	
	public void testPositionedBufferDirect() throws Exception {
		FSEntry positioned = FSEntryBuffer.getPositionedBuffer("aaa", "content");
		
		if( false == "aaa".equals(positioned.getName()) ) {
			fail("Name not expected: "+positioned.getName());
		}
		if( false == positioned.isFile() ) {
			fail("File expected");
		}
		String content = TestSupport.readStringFromFSEntry(positioned);
		if( false == "content".equals(content) ){
			fail("Invalid content");
		}
	}
	
	public void testPositionedBufferPath() throws Exception {
		FSEntry positioned = FSEntryBuffer.getPositionedBuffer("a/b/c.txt", "content");
		
		if( false == "a".equals(positioned.getName()) ) {
			fail("Name not expected: "+positioned.getName());
		}
		if( false == positioned.isDirectory() ) {
			fail("Directory expected");
		}
		FSEntry entry = FSEntrySupport.findDescendant(positioned, "b/c.txt");
		if( null == entry ){
			fail("Can not find descendant");
		} else {
			String content = TestSupport.readStringFromFSEntry(entry);
			if( false == "content".equals(content) ){
				fail("Invalid content");
			}
		}
	}
}