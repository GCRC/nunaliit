package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import junit.framework.TestCase;

public class DbRestoreProcessTest extends TestCase {

	public void testRestore() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			// Create a database for testing
			CouchDb initialCouchDb = DbDumpProcessTest.getTestCouchDb();
			
			// Dump database to a directory
			File dumpDir = null;
			{
				File testDir = TestSupport.getTestRunDir();
				dumpDir = new File(testDir,"testRestore");

				// Perform dump
				DbDumpProcess dumpProcess = new DbDumpProcess(initialCouchDb, dumpDir);
				dumpProcess.setAllDocs(true);
				dumpProcess.dump();
			}
			
			// Create a new database to receive restore
			CouchDb restoredCouchDb = null;
			{
				CouchClient client = TestSupport.getClient();
				String testDbName = TestSupport.getCouchDbName(client);
				restoredCouchDb = client.createDatabase(testDbName);
			}
			
			// Perform restore
			DbRestoreProcess restoreProcess = new DbRestoreProcess(restoredCouchDb, dumpDir);
			restoreProcess.setAllDocs(true);
			restoreProcess.restore();
			
			// Load documents from disk
			Map<String,Document> storedDocumentsFromId = new HashMap<String,Document>();
			{
				FSEntry dumpEntry = new FSEntryFile(dumpDir);
				for(FSEntry child : dumpEntry.getChildren()){
					Document doc = DocumentFile.createDocument(child);
					storedDocumentsFromId.put(doc.getId(), doc);
				}
			}
			
			// Verify that all documents on disk are available on the database
			// and are the same
			DigestComputer dc = new DigestComputerSha1();
			for(Document diskDocument : storedDocumentsFromId.values()){
				String docId = diskDocument.getId();
				
				Document restoredDocument = DocumentCouchDb.documentFromCouchDb(restoredCouchDb, docId);
				if( null == restoredDocument ) {
					fail("Document "+docId+" not found in restored database");
				} else {
					DocumentDigest diskDD = dc.computeDocumentDigest(diskDocument);
					DocumentDigest restoredDD = dc.computeDocumentDigest(restoredDocument);
					if( false == diskDD.equals(restoredDD) ){
						fail("Restored document is different than the one found on disk");
					}
				}
			}
		}
	}

	public void testRestoreDocId() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			// Create a database for testing
			CouchDb initialCouchDb = DbDumpProcessTest.getTestCouchDb();
			
			// Dump database to a directory
			File dumpDir = null;
			{
				File testDir = TestSupport.getTestRunDir();
				dumpDir = new File(testDir,"testRestoreDocId");

				// Perform dump
				DbDumpProcess dumpProcess = new DbDumpProcess(initialCouchDb, dumpDir);
				dumpProcess.setAllDocs(true);
				dumpProcess.dump();
			}
			
			// Create a new database to receive restore
			CouchDb restoredCouchDb = null;
			{
				CouchClient client = TestSupport.getClient();
				String testDbName = TestSupport.getCouchDbName(client);
				restoredCouchDb = client.createDatabase(testDbName);
			}
			
			// Select only one document to restore
			Set<String> docIds = new HashSet<String>();
			{
				Document doc = DbDumpProcessTest.getTestDocuments().get(0);
				docIds.add(doc.getId());
			}
			
			// Perform restore
			DbRestoreProcess restoreProcess = new DbRestoreProcess(restoredCouchDb, dumpDir);
			for(String docId : docIds){
				restoreProcess.addDocId(docId);
			}
			restoreProcess.restore();
			
			// Load documents from disk
			Map<String,Document> storedDocumentsFromId = new HashMap<String,Document>();
			{
				FSEntry dumpEntry = new FSEntryFile(dumpDir);
				for(FSEntry child : dumpEntry.getChildren()){
					Document doc = DocumentFile.createDocument(child);
					storedDocumentsFromId.put(doc.getId(), doc);
				}
			}
			
			// Verify that selected documents on disk are available on the database
			// and are the same
			DigestComputer dc = new DigestComputerSha1();
			for(String docId : docIds){
				Document diskDocument = storedDocumentsFromId.get(docId);
				
				Document restoredDocument = DocumentCouchDb.documentFromCouchDb(restoredCouchDb, docId);
				if( null == restoredDocument ) {
					fail("Document "+docId+" not found in restored database");
				} else {
					DocumentDigest diskDD = dc.computeDocumentDigest(diskDocument);
					DocumentDigest restoredDD = dc.computeDocumentDigest(restoredDocument);
					if( false == diskDD.equals(restoredDD) ){
						fail("Restored document is different than the one found on disk");
					}
				}
			}
			
			// Verify that documents not selected for restore are not on database
			for(Document diskDoc : storedDocumentsFromId.values()){
				String docId = diskDoc.getId();
				
				if( false == docIds.contains(docId) ){
					// Not supposed to be restored
					boolean exists = restoredCouchDb.documentExists(docId);
					if( exists ) {
						fail("Document is restored while it was not selected: "+docId);
					}
				}
			}
		}
	}
}
