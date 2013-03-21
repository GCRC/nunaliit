package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import junit.framework.TestCase;
import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;

public class DbDumpProcessTest extends TestCase {
	
	static private boolean g_testCouchDbComputed = false;
	static private CouchDb g_testCouchDb = null;
	
	static public List<Document> getTestDocuments() throws Exception {
		List<Document> documents = new Vector<Document>();
		
		{
			List<FSEntry> mergedEntries = new Vector<FSEntry>();
			mergedEntries.add( FSEntryBuffer.getPositionedBuffer("a/_id.txt", "doc1") );
			mergedEntries.add( FSEntryBuffer.getPositionedBuffer("a/test.txt", "just a test") );
			FSEntryMerged entry = new FSEntryMerged(mergedEntries);
			Document doc = DocumentFile.createDocument(entry);
			documents.add(doc);
		}
		{
			List<FSEntry> mergedEntries = new Vector<FSEntry>();
			mergedEntries.add( FSEntryBuffer.getPositionedBuffer("a/_id.txt", "doc2") );
			mergedEntries.add( FSEntryBuffer.getPositionedBuffer("a/test.txt", "another a test") );
			mergedEntries.add( FSEntryBuffer.getPositionedBuffer("a/_attachments/att.txt", "an attachment") );
			FSEntryMerged entry = new FSEntryMerged(mergedEntries);
			Document doc = DocumentFile.createDocument(entry);
			documents.add(doc);
		}
		
		return documents;
	}
	
	static public CouchDb getTestCouchDb() throws Exception {
		if( false == g_testCouchDbComputed ){
			g_testCouchDbComputed = true;
			
			try {
				// Create a database for testing
				CouchDb couchDb = null;
				{
					CouchClient client = TestSupport.getClient();
					String testDbName = TestSupport.getCouchDbName(client);
					couchDb = client.createDatabase(testDbName);
				}
				
				// Upload documents to database
				{
					DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
					List<Document> documents = getTestDocuments();
					for(Document doc : documents){
						updateProcess.update(doc);
					}
				}
				
				g_testCouchDb = couchDb;
				
			} catch(Exception e) {
				throw new Exception("Unable to create test database", e);
			}
		}
		
		return g_testCouchDb;
	}

	public void testDump() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			// Create a database for testing
			CouchDb couchDb = getTestCouchDb();
			
			// Create directory to receive dump
			File dumpDir = null;
			{
				File testDir = TestSupport.getTestRunDir();
				dumpDir = new File(testDir,"testDump");
			}

			// Perform dump
			DbDumpProcess dumpProcess = new DbDumpProcess(couchDb, dumpDir);
			dumpProcess.setAllDocs(true);
			dumpProcess.dump();
			
			// Get documents
			Map<String,Document> documentsFromId = new HashMap<String,Document>();
			for(Document doc : getTestDocuments()){
				documentsFromId.put(doc.getId(), doc);
			}
			
			// Load documents from disk
			Map<String,Document> storedDocumentsFromId = new HashMap<String,Document>();
			{
				FSEntry dumpEntry = new FSEntryFile(dumpDir);
				for(FSEntry child : dumpEntry.getChildren()){
					Document doc = DocumentFile.createDocument(child);
					storedDocumentsFromId.put(doc.getId(), doc);
				}
			}
			
			// Compare both sets
			if( documentsFromId.size() != storedDocumentsFromId.size() ) {
				fail("Unexpected number of stored documents: "+storedDocumentsFromId.size());
			}
			DigestComputer dc = new DigestComputerSha1();
			for(String docId : documentsFromId.keySet()){
				Document testDoc = documentsFromId.get(docId);
				Document storedDoc = storedDocumentsFromId.get(docId);
				
				if( null == storedDoc ){
					fail("Document "+docId+" was not stored to disk.");
				}
				
				DocumentDigest docDD = dc.computeDocumentDigest(testDoc);
				DocumentDigest dbDD = dc.computeDocumentDigest(storedDoc);
				if( false == docDD.equals(dbDD) ){
					fail("Stored document is different than the one used in test");
				}
			}
		}
	}

	public void testDumpDocId() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			// Create a database for testing
			CouchDb couchDb = getTestCouchDb();
			
			// Create directory to receive dump
			File dumpDir = null;
			{
				File testDir = TestSupport.getTestRunDir();
				dumpDir = new File(testDir,"testDumpDocId");
			}
			
			// Select only first document for dumping
			Map<String,Document> documentsToDump = new HashMap<String,Document>();
			documentsToDump.put( getTestDocuments().get(0).getId(), getTestDocuments().get(0) );

			// Perform dump with only first document
			DbDumpProcess dumpProcess = new DbDumpProcess(couchDb, dumpDir);
			for(Document doc : documentsToDump.values()){
				dumpProcess.addDocId( doc.getId() );
			}
			dumpProcess.dump();
			
			// Load documents from disk
			Map<String,Document> storedDocumentsFromId = new HashMap<String,Document>();
			{
				FSEntry dumpEntry = new FSEntryFile(dumpDir);
				for(FSEntry child : dumpEntry.getChildren()){
					Document doc = DocumentFile.createDocument(child);
					storedDocumentsFromId.put(doc.getId(), doc);
				}
			}
			
			// Compare both sets
			if( documentsToDump.size() != storedDocumentsFromId.size() ) {
				fail("Unexpected number of stored documents: "+storedDocumentsFromId.size());
			}
			DigestComputer dc = new DigestComputerSha1();
			for(String docId : documentsToDump.keySet()){
				Document testDoc = documentsToDump.get(docId);
				Document storedDoc = storedDocumentsFromId.get(docId);
				
				if( null == storedDoc ){
					fail("Document "+docId+" was not stored to disk.");
				}
				
				DocumentDigest docDD = dc.computeDocumentDigest(testDoc);
				DocumentDigest dbDD = dc.computeDocumentDigest(storedDoc);
				if( false == docDD.equals(dbDD) ){
					fail("Stored document is different than the one used in test");
				}
			}
		}
	}

	public void testDumpDocIdToFile() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			// Create a database for testing
			CouchDb couchDb = getTestCouchDb();
			
			// Create directory to receive dump
			File dumpDir = null;
			{
				File testDir = TestSupport.getTestRunDir();
				dumpDir = new File(testDir,"testDumpDocIdToFile");
			}
			
			// Select only first document for dumping
			Document documentToDump = getTestDocuments().get(0);
			File location = new File(dumpDir, "test");

			// Perform dump with only first document
			DbDumpProcess dumpProcess = new DbDumpProcess(couchDb, dumpDir);
			dumpProcess.addDocId( documentToDump.getId(), location );
			dumpProcess.dump();
			
			// Load document from disk
			FSEntry dumpedDocEntry = new FSEntryFile(location);
			Document dumpedDoc = DocumentFile.createDocument(dumpedDocEntry);
			
			// Compare both documents
			{
				DigestComputer dc = new DigestComputerSha1();
				
				DocumentDigest docDD = dc.computeDocumentDigest(documentToDump);
				DocumentDigest dbDD = dc.computeDocumentDigest(dumpedDoc);
				if( false == docDD.equals(dbDD) ){
					fail("Stored document is different than the one used in test");
				}
			}
		}
	}

	public void testDumpDocIdToNonEmptyDir() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			// Create a database for testing
			CouchDb couchDb = getTestCouchDb();
			
			// Create directory to receive dump
			File dumpDir = null;
			{
				File testDir = TestSupport.getTestRunDir();
				dumpDir = new File(testDir,"testDumpDocIdToNonEmptyDir");
			}
			
			// Select only first document for dumping
			Document documentToDump = getTestDocuments().get(0);
			File location = new File(dumpDir, "test");
			
			// Create directory and put stuff in it
			{
				location.mkdirs();
				
				byte[] content = new byte[]{(byte)'a', (byte)'b', (byte)'c'};
				File attrFile = new File(location,"attribute.txt");
				FileOutputStream fos = new FileOutputStream(attrFile);
				fos.write(content);
				fos.close();
			}

			// Perform dump with only first document
			DbDumpProcess dumpProcess = new DbDumpProcess(couchDb, dumpDir);
			dumpProcess.addDocId( documentToDump.getId(), location );
			dumpProcess.dump();
			
			// Load document from disk
			FSEntry dumpedDocEntry = new FSEntryFile(location);
			Document dumpedDoc = DocumentFile.createDocument(dumpedDocEntry);
			
			// Compare both documents
			{
				DigestComputer dc = new DigestComputerSha1();
				
				DocumentDigest docDD = dc.computeDocumentDigest(documentToDump);
				DocumentDigest dbDD = dc.computeDocumentDigest(dumpedDoc);
				if( false == docDD.equals(dbDD) ){
					fail("Stored document is different than the one used in test");
				}
			}
		}
	}
}
