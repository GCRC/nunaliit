package ca.carleton.gcrc.couch.app;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStreamReader;

import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.StreamProducerDocumentUpdate;
import ca.carleton.gcrc.couch.app.impl.UpdateSpecifier;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.TestSupport;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import junit.framework.TestCase;

public class StreamProducerTest extends TestCase {

	public void testCreate() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc1");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			
			DigestComputerSha1 digestComputer = new DigestComputerSha1();
			DocumentDigest dd = digestComputer.computeDocumentDigest(doc);
			
			UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(
					doc
					,dd
					,null
					,DocumentUpdateProcess.Schedule.UPDATE_UNLESS_MODIFIED
					);
			
			StreamProducerDocumentUpdate producer = new StreamProducerDocumentUpdate(
				doc
				,dd
				,null
				,updateSpecifier
				);
			
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			producer.produce(baos);
			
			ByteArrayInputStream bais = new ByteArrayInputStream( baos.toByteArray() );
			InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
			BufferedReader br = new BufferedReader(isr);
			String output = br.readLine();
			System.out.println(output);
		}
	}

	public void testCreateAttachment() throws Exception {
		CouchDb couchDb = TestSupport.getTestCouchDb();
		if( null != couchDb ) {
			File f = TestSupport.findResourceFile("doc2");
			FSEntry file = new FSEntryFile( f );
			
			Document doc = DocumentFile.createDocument(file);
			
			DigestComputerSha1 digestComputer = new DigestComputerSha1();
			DocumentDigest dd = digestComputer.computeDocumentDigest(doc);
			
			UpdateSpecifier updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(
					doc
					,dd
					,null
					,DocumentUpdateProcess.Schedule.UPDATE_UNLESS_MODIFIED
					);
			
			StreamProducerDocumentUpdate producer = new StreamProducerDocumentUpdate(
				doc
				,dd
				,null
				,updateSpecifier
				);
			
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			producer.produce(baos);
			
			ByteArrayInputStream bais = new ByteArrayInputStream( baos.toByteArray() );
			InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
			BufferedReader br = new BufferedReader(isr);
			String output = br.readLine();
			System.out.println(output);
		}
		
	}
}
