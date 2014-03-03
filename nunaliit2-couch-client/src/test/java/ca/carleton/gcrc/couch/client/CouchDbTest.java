package ca.carleton.gcrc.couch.client;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import junit.framework.TestCase;

import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

public class CouchDbTest extends TestCase {
	
	public void testCreateDocumentWithoutId() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			JSONObject doc = new JSONObject();
			doc.put("test", "value");
			
			db.createDocument(doc);
			String id = doc.getString("_id");
			
			if( false == db.documentExists(id) ) {
				fail("Failed to create document");
			}
		}
	}
	
	public void testCreateDocumentWithId() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testCreateDocumentWithId";
			
			JSONObject doc = new JSONObject();
			doc.put("_id",docId);
			doc.put("test", "value");
			
			JSONObject result = db.createDocument(doc);
			
			// Verify id
			String id = result.getString("id");
			if( false == docId.equals(id) ) {
				fail("Invalid _id returned");
			}
			
			if( false == db.documentExists(id) ) {
				fail("Failed to create document");
			}
		}
	}
	
	public void testDocumentExists() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testDocumentExists";
			
			if( db.documentExists(docId) ) {
				fail("Document does not yet exist");
			}

			// Create document
			{
				JSONObject doc = new JSONObject();
				doc.put("_id",docId);
				doc.put("test", "value");
				
				db.createDocument(doc);
			}
			
			if( false == db.documentExists(docId) ) {
				fail("Document should be reported as it exists");
			}
		}
	}
	
	public void testGetDocument() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testGetDocument";
			
			// Create document
			{
				JSONObject doc = new JSONObject();
				doc.put("_id",docId);
				doc.put("test", "value");
				
				db.createDocument(doc);
			}
			
			JSONObject doc = db.getDocument(docId);
			String test = doc.getString("test");
			if( false == "value".equals(test) ) {
				fail("Wrong value returned");
			}
		}
	}
	
	public void testGetDocumentOptions() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testGetDocumentOptions";
			
			// Create document
			{
				JSONObject doc = new JSONObject();
				doc.put("_id",docId);
				doc.put("test", "value");
				
				db.createDocument(doc);
			}
			
			// Update document
			{
				JSONObject doc = db.getDocument(docId);
				doc.put("another", "value");
				db.updateDocument(doc);
			}
			
			// Update document again
			{
				JSONObject doc = db.getDocument(docId);
				doc.put("yet_another", "value");
				db.updateDocument(doc);
			}
			
			// Get document with all versions
			String rev = null;
			{
				CouchDocumentOptions options = new CouchDocumentOptions();
				options.setConflicts(true);
				options.setDeletedConflicts(true);
				options.setRevisions(true);
				options.setRevsInfo(true);
				JSONObject doc = db.getDocument(docId,options);
				
				// Check that revisions were sent back
				if( null == doc.opt("_revisions") ){
					fail("Field _revisions not returned");
				}
				
				// Check that revs_info were sent back
				if( null == doc.opt("_revs_info") ){
					fail("Field _revs_info not returned");
				}
				
				// Parse revision info
				List<RevisionInfo> revsInfo = RevisionInfo.parseDoc(doc);
				if( revsInfo.size() != 3 ){
					fail("Expecting 3 revisions");
				} else {
					rev = revsInfo.get(1).getRev();
				}
			}
			
			// Retrieve a specific version
			{
				CouchDocumentOptions options = new CouchDocumentOptions();
				options.setRevision(rev);
				JSONObject doc = db.getDocument(docId,options);
				
				if( false == rev.equals(doc.getString("_rev")) ){
					fail("Unable to retrieve specific revision");
				}
			}
		}
	}
	
	public void testGetDocumentRevision() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testGetDocumentRevision";
			
			// Create document
			String initialRevision = null;
			{
				JSONObject doc = new JSONObject();
				doc.put("_id",docId);
				doc.put("test", "value");
				
				JSONObject created = db.createDocument(doc);
				initialRevision = created.getString("rev");
			}
			
			String check = db.getDocumentRevision(docId);
			if( false == initialRevision.equals(check) ) {
				fail("Unmatched revision on initial");
			}
			
			// Update document
			String updatedRevision = null;
			{
				JSONObject doc = db.getDocument(docId);
				doc.put("updated", true);
				
				//JSONObject created = 
					db.updateDocument(doc);
				updatedRevision = doc.getString("_rev");
			}
			
			check = db.getDocumentRevision(docId);
			if( false == updatedRevision.equals(check) ) {
				fail("Unmatched revision on updated");
			}
		}
	}
	
	public void testGetDocuments() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId1 = "testGetDocuments1";
			String docId2 = "testGetDocuments2";
			
			// Create documents
			{
				JSONObject doc = new JSONObject();
				doc.put("_id",docId1);
				doc.put("test", docId1);
				
				db.createDocument(doc);
			}
			{
				JSONObject doc = new JSONObject();
				doc.put("_id",docId2);
				doc.put("test", docId2);
				
				db.createDocument(doc);
			}
			
			List<String> docIds = new Vector<String>();
			docIds.add(docId1);
			docIds.add(docId2);
			Collection<JSONObject> docs = db.getDocuments(docIds);
			
			if( 2 != docs.size() ){
				fail("Inconsistent number of documents returned: "+docs.size());
			} else {
				Map<String,JSONObject> map = new HashMap<String,JSONObject>();
				for(JSONObject doc : docs){
					map.put(doc.getString("_id"), doc);
				}
				
				// Check first document
				if( false == map.containsKey(docId1) ){
					fail("Unable to find document: "+docId1);
				} else {
					String value = map.get(docId1).getString("test");
					if( false == docId1.equals(value) ){
						fail("Invalid value in document: "+docId1);
					}
				}
				
				// Check second document
				if( false == map.containsKey(docId2) ){
					fail("Unable to find document: "+docId2);
				} else {
					String value = map.get(docId2).getString("test");
					if( false == docId2.equals(value) ){
						fail("Invalid value in document: "+docId2);
					}
				}
			}
		}
	}
	
	public void testUpdateDocument() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testUpdateDocument";
			
			// Create document
			JSONObject doc = null;
			{
				doc = new JSONObject();
				doc.put("_id",docId);
				doc.put("test", "value");
				
				db.createDocument(doc);
			}
			
			// Capture initial revision
			String initialRevision = doc.getString("_rev");
			
			// Modify document
			doc.put("test","newValue");
			doc.put("updated",true);
			
			// Update
			db.updateDocument(doc);

			// Verify
			String updatedRevision = doc.getString("_rev");
			if( initialRevision.equals(updatedRevision) ) {
				fail("Expected an updated document revision");
			}
			if( false == "newValue".equals(doc.getString("test")) ) {
				fail("Expected an updated value");
			}
			if( true != doc.getBoolean("updated") ) {
				fail("Expected new added value");
			}
		}
	}
	
	public void testDeleteDocument() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testDeleteDocument";
			
			// Create document
			JSONObject doc = null;
			{
				doc = new JSONObject();
				doc.put("_id",docId);
				doc.put("test", "value");
				
				db.createDocument(doc);
			}

			// Verify that document is reported from DB
			if( false == db.documentExists(doc) ) {
				fail("Can not proceed with test: Failure to create document.");
			}
			
			// Update
			db.deleteDocument(doc);

			// Verify
			if( true == db.documentExists(doc) ) {
				fail("Failed to delete document.");
			}
		}
	}

	public void testUploadAttachment() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testUploadAttachment";
			
			JSONObject doc = new JSONObject();
			doc.put("_id",docId);
			doc.put("test", "value");
			
			db.createDocument(doc);

			File attFile = TestSupport.findResourceFile("steps_sound.ogg");
			
			db.uploadAttachment(doc, "att01", attFile, "audio/ogg");

			// Refresh object
			doc = db.getDocument(docId);
			
			// Look for attachment
			if( false == JSONSupport.containsKey(doc, "_attachments") ) {
				fail("Can not find key with attachments");
			} else if( false == JSONSupport.containsKey(doc.getJSONObject("_attachments"), "att01") ) {
				fail("Can not uploaded attachment");
			} else {
				JSONObject att = doc.getJSONObject("_attachments").getJSONObject("att01");
				
				if( 37172 != att.getInt("length") ) {
					fail("Returned wrong length");
				}
				if( false == "audio/ogg".equals(att.getString("content_type")) ) {
					fail("Returned wrong content type");
				}
			}
		}
	}

	public void testDownloadAttachment() throws Exception {
		CouchDb db = TestSupport.getTestCouchDb();
		if( null != db ) {
			String docId = "testDownloadAttachment";
			
			JSONObject doc = new JSONObject();
			doc.put("_id",docId);
			doc.put("test", "value");
			
			db.createDocument(doc);

			File attFile = TestSupport.findResourceFile("steps_sound.ogg");
			
			db.uploadAttachment(doc, "att01", attFile, "audio/ogg");

			// Refresh object
			doc = db.getDocument(docId);
			
			File outputFile = File.createTempFile("download", ".ogg");
			FileOutputStream fos = new FileOutputStream(outputFile);
			db.downloadAttachment(doc, "att01", fos);
			fos.close();
			
			long fileLen = outputFile.length();
			if( 37172 != fileLen ) {
				fail("Size mistmatch: "+fileLen);
			}
		}
	}
}
