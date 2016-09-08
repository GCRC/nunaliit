package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import junit.framework.TestCase;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.DocumentJSON;
import ca.carleton.gcrc.couch.app.impl.DocumentStoreProcessImpl;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;
import ca.carleton.gcrc.json.JSONObjectComparator;
import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.utils.Files;

public class DocumentStoreProcessTest extends TestCase {

	static public File findResourceDirectory(String name) {
		URL url = DocumentStoreProcessTest.class.getClassLoader().getResource(name);
		File file = new File(url.getPath());
		return file;
	}

	public void testObjectStoring() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File testDir = TestSupport.getTestRunDir();
			File dir = new File(testDir, "testObjectStoring");

			JSONObject obj = new JSONObject();
			obj.put("_id", "testObjectStoring");
			obj.put("b1", true);
			obj.put("b2", false);
			obj.put("i", 123);
			obj.put("s", "string");

			JSONObject innerObj = new JSONObject();
			innerObj.put("a", "1");
			obj.put("obj", innerObj);

			JSONArray innerArr = new JSONArray();
			innerArr.put(1);
			innerArr.put(2);
			innerArr.put(3);
			obj.put("arr", innerArr);
			
			Document doc = new DocumentJSON(obj);
			
			DocumentStoreProcess storeProcess = new DocumentStoreProcessImpl();
			storeProcess.store(doc, dir);
			
			// Verify the store
			{
				FSEntry fileEntry = new FSEntryFile(dir);
				Document diskDoc = DocumentFile.createDocument(fileEntry);
				
				JSONObject jsonDisk = diskDoc.getJSONObject();
				
				if( 0 != JSONObjectComparator.singleton.compare(obj, jsonDisk) ) {
					fail("Stored object loaded from disk differs from original one");
				}
			}
		}
	}

	public void testKeysToIgnore() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File testDir = TestSupport.getTestRunDir();
			File dir = new File(testDir, "testKeysToIgnore");

			JSONObject obj = new JSONObject();
			obj.put("_id", "testObjectStoring");
			obj.put("b1", true);
			obj.put("b2", false);
			obj.put("i", 123);
			obj.put("s", "string");

			JSONObject innerObj = new JSONObject();
			innerObj.put("a", "1");
			obj.put("obj", innerObj);

			JSONArray innerArr = new JSONArray();
			innerArr.put(1);
			innerArr.put(2);
			innerArr.put(3);
			obj.put("arr", innerArr);
			
			Document doc = new DocumentJSON(obj);
			
			DocumentStoreProcessImpl storeProcess = new DocumentStoreProcessImpl();
			storeProcess.addKeyToIgnore("obj");
			storeProcess.addKeyToIgnore("arr");
			storeProcess.store(doc, dir);
			
			// Verify the store
			{
				FSEntry fileEntry = new FSEntryFile(dir);
				Document diskDoc = DocumentFile.createDocument(fileEntry);
				
				JSONObject jsonDisk = diskDoc.getJSONObject();

				JSONObject expected = new JSONObject();
				expected.put("_id", "testObjectStoring");
				expected.put("b1", true);
				expected.put("b2", false);
				expected.put("i", 123);
				expected.put("s", "string");
				
				if( 0 != JSONSupport.compare(expected, jsonDisk) ) {
					fail("Stored object loaded from disk differs from expected one");
				}
			}
		}
	}

	public void testAttachments() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File testDir = TestSupport.getTestRunDir();
			File dir = new File(testDir, "testAttachments");

			Document doc = null;
			{
				List<FSEntry> entries = new Vector<FSEntry>();
				
				{
					FSEntry entry = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testAttachments");
					entries.add(entry);
				}
				
				{
					FSEntry entry = FSEntryBuffer.getPositionedBuffer("a/_attachments/test.txt", "just a test");
					entries.add(entry);
				}
				
				{
					FSEntry entry = FSEntryBuffer.getPositionedBuffer("a/_attachments/sub/child.txt", "a child element in a sub-directory");
					entries.add(entry);
				}
				
				FSEntryMerged mergedEntry = new FSEntryMerged(entries);
				doc = DocumentFile.createDocument(mergedEntry);
			}
			
			DocumentStoreProcess storeProcess = new DocumentStoreProcessImpl();
			storeProcess.store(doc, dir);
			
			// Verify the store
			{
				FSEntry fileEntry = new FSEntryFile(dir);
				Document diskDoc = DocumentFile.createDocument(fileEntry);

				// Check that documents are the same
				DigestComputer dc = new DigestComputerSha1();
				DocumentDigest docDD = dc.computeDocumentDigest(doc);
				DocumentDigest diskDD = dc.computeDocumentDigest(diskDoc);
				if( false == docDD.equals(diskDD) ){
					fail("Documents are different");
				}
			}
		}
	}

	public void testAttachmentFileInfo() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File testDir = TestSupport.getTestRunDir();
			File dir = new File(testDir, "testAttachmentFileInfo");

			Document doc = null;
			{
				List<FSEntry> entries = new Vector<FSEntry>();
				
				{
					FSEntry entry = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testAttachmentFileInfo");
					entries.add(entry);
				}
				
				{
					FSEntry entry = FSEntryBuffer.getPositionedBuffer("a/_attachments/test.txt", "just a test");
					entries.add(entry);
				}
				
				{
					FSEntry entry = FSEntryBuffer.getPositionedBuffer("a/_attachments/test.txt._nunaliit", "{\"content_type\":\"abc/def\"}");
					entries.add(entry);
				}
				
				FSEntryMerged mergedEntry = new FSEntryMerged(entries);
				doc = DocumentFile.createDocument(mergedEntry);
			}
			
			DocumentStoreProcess storeProcess = new DocumentStoreProcessImpl();
			storeProcess.store(doc, dir);
			
			// Verify the store
			{
				FSEntry fileEntry = new FSEntryFile(dir);
				Document diskDoc = DocumentFile.createDocument(fileEntry);

				Collection<Attachment> attachments = diskDoc.getAttachments();
				if( attachments.size() != 1 ) {
					fail("Unexpected attachment count: "+attachments.size());
				} else {
					Attachment att = attachments.iterator().next();
					if( false == "abc/def".equals(att.getContentType()) ){
						fail("Unexpected content-type: "+att.getContentType());
					}
				}
			}
		}
	}
	
	public void testDumpOverwrite() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File original = findResourceDirectory("storeOverwrite");
			File testDir = TestSupport.getTestRunDir();
			File dir = new File(testDir, "storeOverwrite");
			
			Files.copy(original, dir);
			
			// Load from disk
			Document doc = null;
			{
				FSEntry fileEntry = new FSEntryFile(dir);
				doc = DocumentFile.createDocument(fileEntry);
			}

			// Store back to disk
			DocumentStoreProcess storeProcess = new DocumentStoreProcessImpl();
			storeProcess.store(doc, dir);
			
			Set<String> originalPaths = Files.getDescendantPathNames(original, true);
			Set<String> targetPaths = Files.getDescendantPathNames(dir, true);
			
			// Both sets of paths should be identical
			if( originalPaths.size() != targetPaths.size() ){
				fail("The path sets are of different sizes.");
			} else {
				ArrayList<String> originalPathsSorted = new ArrayList<String>(originalPaths);
				Collections.sort(originalPathsSorted);
				ArrayList<String> targetPathsSorted = new ArrayList<String>(targetPaths);
				Collections.sort(targetPathsSorted);
				
				for(int i=0,e=originalPathsSorted.size(); i<e; ++i){
					String originalName = originalPathsSorted.get(i);
					String targetName = targetPathsSorted.get(i);
					if( false == originalName.equals(targetName) ){
						fail("The path sets are not equivalent");
						break;
					}
				}
			}
		}
	}
}
