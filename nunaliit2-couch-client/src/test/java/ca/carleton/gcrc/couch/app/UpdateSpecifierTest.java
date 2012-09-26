package ca.carleton.gcrc.couch.app;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.UpdateSpecifier;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;
import junit.framework.TestCase;

public class UpdateSpecifierTest extends TestCase {

	public void testNoUpdate() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			FSEntry id = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testNoUpdate");
			FSEntry test = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1}");
			FSEntry att1 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "abc");
			FSEntry att2 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att2.txt", "123");
			
			// Create original document
			Document original = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				original = DocumentFile.createDocument(entry);
			}
			
			// Push original document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(original);

			// Check that update specifier does not report any changes from original
			{
				Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, original.getId());
				UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(original, dbDoc.getJSONObject());
				if( updateSpecifier.isUpdateRequired() ){
					fail("No changes. Update specifier should not request an update");
				}
			}
		}
	}

	public void testJsonUpdate() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			FSEntry id = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testJsonUpdate");
			FSEntry test = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1}");
			FSEntry test_updated = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1,\"b\":2}");
			FSEntry att1 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "abc");
			FSEntry att2 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att2.txt", "123");
			
			// Create original document
			Document original = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				original = DocumentFile.createDocument(entry);
			}
			
			// Push original document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(original);

			// Create updated document
			Document updated = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test_updated);
				mergedEntries.add(att1);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				updated = DocumentFile.createDocument(entry);
			}
			
			// Check that update specifier reports only the affected attachment
			{
				Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, original.getId());
				UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(updated, dbDoc.getJSONObject());
				if( false == updateSpecifier.isUpdateRequired() ){
					fail("Changes should have been detected");
				}
				
				if( false == updateSpecifier.isDocumentModified() ) {
					fail("Document was modified");
				}
				
				if( 0 != updateSpecifier.getAttachmentsToDelete().size() ) {
					fail("No deletion should be reported");
				}
				
				if( 2 != updateSpecifier.getAttachmentsNotModified().size() ) {
					fail("Exactly two attachments should not be modified");
				}
				
				if( 0 != updateSpecifier.getAttachmentsToUpload().size() ) {
					fail("No attachment should be uploaded");
				}
			}
		}
	}

	public void testUpdatedAttachment() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			FSEntry id = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testUpdatedAttachment");
			FSEntry test = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1}");
			FSEntry att1 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "abc");
			FSEntry att2 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att2.txt", "123");
			FSEntry att2_updated = FSEntryBuffer.getPositionedBuffer("a/_attachments/att2.txt", "12345");
			
			// Create original document
			Document original = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				original = DocumentFile.createDocument(entry);
			}
			
			// Push original document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(original);

			// Create updated document
			Document updated = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				mergedEntries.add(att2_updated);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				updated = DocumentFile.createDocument(entry);
			}
			
			// Check that update specifier reports only the affected attachment
			{
				Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, original.getId());
				UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(updated, dbDoc.getJSONObject());
				if( false == updateSpecifier.isUpdateRequired() ){
					fail("Changes should have been detected");
				}
				
				if( true == updateSpecifier.isDocumentModified() ) {
					fail("Document was not modified");
				}
				
				if( 0 != updateSpecifier.getAttachmentsToDelete().size() ) {
					fail("No deletion should be reported");
				}
				
				if( 1 != updateSpecifier.getAttachmentsNotModified().size() ) {
					fail("Exactly one attachment should not be modified");
				}
				
				if( 1 != updateSpecifier.getAttachmentsToUpload().size() ) {
					fail("Exactly one attachment should be uploaded");
				}
				
				if( false == "att2.txt".equals( updateSpecifier.getAttachmentsToUpload().iterator().next() ) ){
					fail("Wrong attachment reported for upload");
				}
			}
		}
	}

	public void testAddAttachment() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			FSEntry id = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testAddAttachment");
			FSEntry test = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1}");
			FSEntry att1 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "abc");
			FSEntry att2 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att2.txt", "123");
			
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
			
			// Push original document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(original);

			// Create updated document
			Document updated = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				updated = DocumentFile.createDocument(entry);
			}
			
			// Check that update specifier reports only the affected attachment
			{
				Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, original.getId());
				UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(updated, dbDoc.getJSONObject());
				if( false == updateSpecifier.isUpdateRequired() ){
					fail("Changes should have been detected");
				}
				
				if( true == updateSpecifier.isDocumentModified() ) {
					fail("Document was not modified");
				}
				
				if( 0 != updateSpecifier.getAttachmentsToDelete().size() ) {
					fail("No deletion should be reported");
				}
				
				if( 1 != updateSpecifier.getAttachmentsNotModified().size() ) {
					fail("Exactly one attachment should not be modified");
				}
				
				if( 1 != updateSpecifier.getAttachmentsToUpload().size() ) {
					fail("Exactly one attachment should be uploaded");
				}
				
				if( false == "att2.txt".equals( updateSpecifier.getAttachmentsToUpload().iterator().next() ) ){
					fail("Wrong attachment reported for upload");
				}
			}
		}
	}

	public void testDeleteAttachment() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			FSEntry id = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testDeleteAttachment");
			FSEntry test = FSEntryBuffer.getPositionedBuffer("a/test.json", "{\"a\":1}");
			FSEntry att1 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "abc");
			FSEntry att2 = FSEntryBuffer.getPositionedBuffer("a/_attachments/att2.txt", "123");
			
			// Create original document
			Document original = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				mergedEntries.add(att2);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				original = DocumentFile.createDocument(entry);
			}
			
			// Push original document to database
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.update(original);

			// Create updated document
			Document updated = null;
			{
				List<FSEntry> mergedEntries = new Vector<FSEntry>();
				mergedEntries.add(id);
				mergedEntries.add(test);
				mergedEntries.add(att1);
				FSEntryMerged entry = new FSEntryMerged(mergedEntries);
				updated = DocumentFile.createDocument(entry);
			}
			
			// Check that update specifier reports only the affected attachment
			{
				Document dbDoc = DocumentCouchDb.documentFromCouchDb(couchDb, original.getId());
				UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(updated, dbDoc.getJSONObject());
				if( false == updateSpecifier.isUpdateRequired() ){
					fail("Changes should have been detected");
				}
				
				if( true == updateSpecifier.isDocumentModified() ) {
					fail("Document was not modified");
				}
				
				if( 1 != updateSpecifier.getAttachmentsToDelete().size() ) {
					fail("Exactly one deletion should be reported");
				}
				
				if( false == "att2.txt".equals( updateSpecifier.getAttachmentsToDelete().iterator().next() ) ){
					fail("Wrong attachment reported for deletion");
				}
				
				if( 1 != updateSpecifier.getAttachmentsNotModified().size() ) {
					fail("Exactly one attachment should not be modified");
				}
				
				if( 0 != updateSpecifier.getAttachmentsToUpload().size() ) {
					fail("No attachment should be uploaded");
				}
			}
		}
	}
}
