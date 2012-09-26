package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.DocumentManifest;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;
import junit.framework.TestCase;

public class DocumentUpdateProcessTest extends TestCase {

	public void testCreation() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc1");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			doc.setId("testCreation");
			
			// Push document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(doc);
			
			// Get document from database
			Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, doc.getId());
			
			// Check that documents are the same
			DigestComputer dc = new DigestComputerSha1();
			DocumentDigest docDD = dc.computeDocumentDigest(doc);
			DocumentDigest dbDD = dc.computeDocumentDigest(dbDoc);
			if( false == docDD.equals(dbDD) ){
				fail("Document in database is different than document on disk");
			}
			
			// Check that document in database verifies as not modified
			if( true == DocumentManifest.hasDocumentBeenModified(dbDoc.getJSONObject()) ){
				fail("Document should not report that it was modified");
			}
		}
	}

	public void testCreationWithAttachments() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc2");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			doc.setId("testCreationWithAttachments");
			
			// Push document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(doc);
			
			// Get document from database
			Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, doc.getId());
			
			// Check that documents are the same
			DigestComputer dc = new DigestComputerSha1();
			DocumentDigest docDD = dc.computeDocumentDigest(doc);
			DocumentDigest dbDD = dc.computeDocumentDigest(dbDoc);
			if( false == docDD.equals(dbDD) ){
				fail("Document in database is different than document on disk");
			}
			
			// Check that document in database verifies as not modified
			if( true == DocumentManifest.hasDocumentBeenModified(dbDoc.getJSONObject()) ){
				fail("Document should not report that it was modified");
			}
		}
	}

	public void testUpdateUnlessModified() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc2");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			doc.setId("testUpdateUnlessModified");
			
			// Push document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			DocumentUpdateListenerCounter updateListener = new DocumentUpdateListenerCounter();
			updateProcess.setListener(updateListener);
			updateProcess.update(doc);
			
			// Modify document
			{
				JSONObject currentDoc = couchDb.getDocument(doc.getId());
				currentDoc.put("mytest", "mytest");
				couchDb.updateDocument(currentDoc);
			}
			
			// Check that document in database verifies as modified
			{
				JSONObject dbJson = couchDb.getDocument(doc.getId());
				if( false == DocumentManifest.hasDocumentBeenModified(dbJson) ){
					fail("Document should report that it was modified");
				}
			}

			// Attempt to push again
			updateProcess.update(doc);
			
			// Check that listener was called
			if( 1 != updateListener.getSkippedBecauseModified() ) {
				fail("Document not reported as skipped because of modification");
			}
			
			// Verify that changes are still available
			{
				JSONObject currentDoc = couchDb.getDocument(doc.getId());
				String value = currentDoc.optString("mytest");
				if( null == value ) {
					fail("Changes disappeared");
				} else if( false == "mytest".equals(value) ){
					fail("Unexpected change: "+value);
				}
			}
		}
	}

	public void testUpdateForced() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc2");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			doc.setId("testUpdateForced");
			
			// Push document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(doc);
			
			// Modify document
			{
				JSONObject currentDoc = couchDb.getDocument(doc.getId());
				currentDoc.put("mytest", "mytest");
				couchDb.updateDocument(currentDoc);
			}

			// Force a push
			updateProcess.update(doc, true); // forced
			
			// Get document from database
			Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, doc.getId());
			
			// Check that documents are the same
			DigestComputer dc = new DigestComputerSha1();
			DocumentDigest docDD = dc.computeDocumentDigest(doc);
			DocumentDigest dbDD = dc.computeDocumentDigest(dbDoc);
			if( false == docDD.equals(dbDD) ){
				fail("Document in database is different than document on disk");
			}
			
			// Check that document in database verifies as not modified
			if( true == DocumentManifest.hasDocumentBeenModified(dbDoc.getJSONObject()) ){
				fail("Document should not report that it was modified");
			}
		}
	}

	public void testUpdateEvenIfModified() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc2");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			doc.setId("testUpdateEvenIfModified");
			
			// Push document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(doc);
			
			// Modify document
			{
				JSONObject currentDoc = couchDb.getDocument(doc.getId());
				currentDoc.put("mytest", "mytest");
				couchDb.updateDocument(currentDoc);
			}

			// Force a push
			updateProcess.update(
					doc
					,DocumentUpdateProcess.Schedule.UPDATE_EVEN_IF_MODIFIED
					);
			
			// Get document from database
			Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, doc.getId());
			
			// Check that documents are the same
			DigestComputer dc = new DigestComputerSha1();
			DocumentDigest docDD = dc.computeDocumentDigest(doc);
			DocumentDigest dbDD = dc.computeDocumentDigest(dbDoc);
			if( false == docDD.equals(dbDD) ){
				fail("Document in database is different than document on disk");
			}
			
			// Check that document in database verifies as not modified
			if( true == DocumentManifest.hasDocumentBeenModified(dbDoc.getJSONObject()) ){
				fail("Document should not report that it was modified");
			}
		}
	}

	public void testUpdateAttachment() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			FSEntry id = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "updateatt");
			FSEntry test = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1}");
			FSEntry att1 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att.txt", "abc");
			FSEntry att2 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att.txt", "123");
			
			// Create original document
			Document original = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				original = DocumentFile.createDocument(entry);
			}
			
			// Create updated document
			Document updated = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				updated = DocumentFile.createDocument(entry);
			}
			
			// Push original document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(original);
			
			// Push updated document to database
			updateProcess.update(updated);
			
			// Get document from database
			Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, original.getId());
			
			// Check that documents are the same
			DigestComputer dc = new DigestComputerSha1();
			DocumentDigest docDD = dc.computeDocumentDigest(updated);
			DocumentDigest dbDD = dc.computeDocumentDigest(dbDoc);
			if( false == docDD.equals(dbDD) ){
				fail("Document in database is different than updated document");
			}
			
			// Check that document in database verifies as not modified
			if( true == DocumentManifest.hasDocumentBeenModified(dbDoc.getJSONObject()) ){
				fail("Document should not report that it was modified");
			}
		}
	}
}
