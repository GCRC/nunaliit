package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.DocumentJSON;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;
import ca.carleton.gcrc.json.JSONObjectComparator;
import junit.framework.TestCase;

public class DocumentStoreProcessTest extends TestCase {

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
			
			DocumentStoreProcess storeProcess = new DocumentStoreProcess();
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
			
			DocumentStoreProcess storeProcess = new DocumentStoreProcess();
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
			
			DocumentStoreProcess storeProcess = new DocumentStoreProcess();
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
}
