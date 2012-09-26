package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONObject;

import junit.framework.TestCase;

import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;

public class DocumentFileTest extends TestCase {

	public void testConstructor() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File file = TestSupport.findResourceFile("doc2");
			FSEntry entry = new FSEntryFile(file);

			DocumentFile doc = DocumentFile.createDocument(entry);
			
			// Check id
			if( false == "test:doc2".equals(doc.getId()) ) {
				fail("Invalid id");
			}
			
			// Check JSON
			JSONObject jsonObj = doc.getJSONObject();
			{
				String value = jsonObj.optString("test");
				if( false == "123".equals(value) ){
					fail("Invalid value for field: test");
				}
			}
			
			// Check attachments
			Map<String,Attachment> attMap = new HashMap<String,Attachment>();
			Collection<Attachment> attachments = doc.getAttachments();
			for(Attachment att : attachments){
				attMap.put(att.getName(), att);
			}
			
			if( 2 != attMap.size() ) {
				fail("Invalid number of attachments: "+attMap.size());
			} else {
				if( false == attMap.containsKey("att1.txt") ){
					fail("Missing attachment: att1.txt");
				}
				if( false == attMap.containsKey("sub/att2.txt") ){
					fail("Missing attachment: sub/att2.txt");
				}
			}
		}
	}

	public void testInclude() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File doc3File = TestSupport.findResourceFile("doc3");
			File includeFile = TestSupport.findResourceFile("include");
			FSEntry entry = new FSEntryFile(doc3File);
			FSEntry include = new FSEntryFile(includeFile);

			DocumentFile doc = DocumentFile.createDocument(entry,include);
			
			// Check id
			if( false == "test:doc3".equals(doc.getId()) ) {
				fail("Invalid id");
			}
			
			// Check that file was included
			JSONObject jsonObj = doc.getJSONObject();
			{
				String value = jsonObj.getString("map");
				if( false == value.contains("INCLUDE_UTIL") ){
					fail("File not included");
				}
			}
		}
	}

	public void testAttachmentInfoFileName() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {

			DocumentFile doc = null;
			{
				List<FSEntry> entries = new Vector<FSEntry>();

				entries.add( FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testAttachmentInfoFile") );
				entries.add( FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "just a test") );
				entries.add( FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt._nunaliit", "{\"name\":\"abc123.jpeg\"}") );
				
				FSEntry merged = new FSEntryMerged(entries);
				doc = DocumentFile.createDocument(merged);
			}

			// Check name with attachment
			Collection<Attachment> attachments = doc.getAttachments();
			if( attachments.size() != 1 ) {
				fail("Unexpected attachment count: "+attachments.size());
			} else {
				Attachment att = attachments.iterator().next();
				
				if( false == "abc123.jpeg".equals(att.getName()) ) {
					fail("Unexpected name: "+att.getName());
				}
				
				if( false == "text/plain".equals(att.getContentType()) ) {
					fail("Unexpected content-type: "+att.getContentType());
				}
			}
		}
	}

	public void testAttachmentInfoFileContentType() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {

			DocumentFile doc = null;
			{
				List<FSEntry> entries = new Vector<FSEntry>();

				entries.add( FSEntryBuffer.getPositionedBuffer("a/_id.txt", "testAttachmentInfoFile") );
				entries.add( FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt", "just a test") );
				entries.add( FSEntryBuffer.getPositionedBuffer("a/_attachments/att1.txt._nunaliit", "{\"content_type\":\"abc/def\"}") );
				
				FSEntry merged = new FSEntryMerged(entries);
				doc = DocumentFile.createDocument(merged);
			}

			// Check content type with attachment
			Collection<Attachment> attachments = doc.getAttachments();
			if( attachments.size() != 1 ) {
				fail("Unexpected attachment count: "+attachments.size());
			} else {
				Attachment att = attachments.iterator().next();
				
				if( false == "abc/def".equals(att.getContentType()) ) {
					fail("Unexpected content type: "+att.getContentType());
				}
				
				if( false == "att1.txt".equals(att.getName()) ){
					fail("Unexpected name: "+att.getName());
				}
			}
		}
	}
}
