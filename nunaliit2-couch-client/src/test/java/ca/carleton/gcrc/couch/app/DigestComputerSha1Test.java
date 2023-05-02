package ca.carleton.gcrc.couch.app;

import ca.carleton.gcrc.couch.app.impl.AttachmentFixed;
import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentJSON;
import org.json.JSONObject;
import org.json.JSONTokener;
import junit.framework.TestCase;

public class DigestComputerSha1Test extends TestCase {

	static JSONObject jsonFromString(String jsonString) throws Exception {
		JSONObject doc = new JSONObject();
		try {
			JSONTokener jsonTokener = new JSONTokener(jsonString);
			Object obj = jsonTokener.nextValue();
			if( obj instanceof JSONObject ) {
				doc = (JSONObject)obj;
			} else {
				throw new Exception("Unexpected returned object type: "+obj.getClass().getSimpleName());
			}
		
			return doc;
			
		} catch(Exception e) {
			throw new Exception("Unable to create JSON object from string", e);
		}
	}

	static DocumentJSON documentFromJsonString(String jsonString) throws Exception {
		JSONObject jsonObj = jsonFromString(jsonString);
		DocumentJSON doc = new DocumentJSON(jsonObj);
		return doc;
	}
	
	public void testKnownAnswer() throws Exception {
		Document doc = documentFromJsonString("{\"obj\":{\"a\":\"a\",\"b\":\"b\"},\"arr\":[0,true,{}]}");
		DigestComputerSha1 dc = new DigestComputerSha1();
		DocumentDigest digest = dc.computeDocumentDigest(doc);
		if( false == "GpdypqVzGwRMDoQQpnWQOcMHSL4=".equals(digest.getDocDigest()) ){
			fail("Unexpected digest");
		}
	}
	
	public void testReordering() throws Exception {
		Document doc = documentFromJsonString("{\"arr\":[0,true,{}],\"obj\":{\"b\":\"b\",\"a\":\"a\"}}");
		DigestComputerSha1 dc = new DigestComputerSha1();
		DocumentDigest digest = dc.computeDocumentDigest(doc);
		if( false == "GpdypqVzGwRMDoQQpnWQOcMHSL4=".equals(digest.getDocDigest()) ){
			fail("Unexpected digest");
		}
	}
	
	public void testSkipReservedFields() throws Exception {
		Document doc = documentFromJsonString("{\"_id\":\"123\",\"obj\":{\"a\":\"a\",\"b\":\"b\"},\"_rev\":\"1-asb\",\"arr\":[0,true,{}]}");
		DigestComputerSha1 dc = new DigestComputerSha1();
		DocumentDigest digest = dc.computeDocumentDigest(doc);
		if( false == "GpdypqVzGwRMDoQQpnWQOcMHSL4=".equals(digest.getDocDigest()) ){
			fail("Unexpected digest");
		}
	}
	
	public void testSkipNunaliitSignature() throws Exception {
		Document doc = documentFromJsonString("{\"obj\":{\"a\":\"a\",\"b\":\"b\"},\"nunaliit_manifest\":\"abcdefgh\",\"arr\":[0,true,{}]}");
		DigestComputerSha1 dc = new DigestComputerSha1();
		DocumentDigest digest = dc.computeDocumentDigest(doc);
		if( false == "GpdypqVzGwRMDoQQpnWQOcMHSL4=".equals(digest.getDocDigest()) ){
			fail("Unexpected digest");
		}
	}
	
	public void testAttachments() throws Exception {
		DocumentJSON doc = documentFromJsonString("{\"obj\":{\"a\":\"a\",\"b\":\"b\"},\"arr\":[0,true,{}]}");
		
		AttachmentFixed att1 = new AttachmentFixed("file.txt","123","text/plain");
		doc.addAttachment(att1);
		
		AttachmentFixed att2 = new AttachmentFixed("view/map.js","function(){}","text/javascript");
		doc.addAttachment(att2);
		
		DigestComputerSha1 dc = new DigestComputerSha1();
		DocumentDigest digest = dc.computeDocumentDigest(doc);

		// Attachments should not affect main digest
		if( false == "GpdypqVzGwRMDoQQpnWQOcMHSL4=".equals(digest.getDocDigest()) ){
			fail("main digest " + digest.getDocDigest() + " doesn't equal expected GpdypqVzGwRMDoQQpnWQOcMHSL4=");
		}
		
		// Check attachments
		if( 2 != digest.getAttachmentNames().size() ) {
			fail("Invalid number of attachments reported");
		} else {
			String attDigest1 = digest.getAttachmentDigest(att1.getName());
			if( false == "QL0AFWMIX8NRZTKeof9cXsvbvu8=".equals(attDigest1) ) {
				fail("Unexpected digest for att1 " + attDigest1 + " doesn't equal expected QL0AFWMIX8NRZTKeof9cXsvbvu8=");
			}

			String attDigest2 = digest.getAttachmentDigest(att2.getName());
			if( false == "xbQXiZMbguab94OYV+glfi6LO7k=".equals(attDigest2) ) {
				fail("Unexpected digest for att2 " + attDigest2 + " doesn't equal expected xbQXiZMbguab94OYV+glfi6LO7k=");
			}
		}
	}
}
