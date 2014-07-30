package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringWriter;

import junit.framework.TestCase;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.onUpload.MockFileConversionContext;

public class AttachmentDescriptorTest extends TestCase {

	public void testRenameAttachment() throws Exception {
		
		JSONObject doc = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("{");
			pw.print("\"_id\":\"identifier\"");
			pw.print(",\"_rev\":\"1-1234\"");
			pw.print(",\"nunaliit_attachments\":{");
			pw.print("\"nunaliit_type\":\"attachment_descriptions\"");
			pw.print(",\"files\":{");
			pw.print("\"test\":{");
			pw.print("\"attachmentName\":\"test\"");
			pw.print(",\"status\":\"submitted\"");
			pw.print(",\"thumbnail\":\"thumbnail\"");
			pw.print("}");
			pw.print(",\"thumbnail\":{");
			pw.print("\"attachmentName\":\"thumbnail\"");
			pw.print(",\"status\":\"submitted\"");
			pw.print(",\"source\":\"test\"");
			pw.print("}");
			pw.print("}}");
			pw.print("}");
			JSONTokener tokener = new JSONTokener(sw.toString());
			Object obj = tokener.nextValue();
			if( obj instanceof JSONObject ){
				doc = (JSONObject)obj;
			} else {
				throw new Exception("Unable to create test document");
			}
		}
		
		FileConversionContext context = new MockFileConversionContext(
				doc
				,null
				,new File(".")
			);
		DocumentDescriptor documentDescriptor = context.getDocument();
		
		String newAttName = "media";
		AttachmentDescriptor att = documentDescriptor.getAttachmentDescription("test");
		att.renameAttachmentTo(newAttName);
		
		if( false == newAttName.equals(att.getAttachmentName()) ){
			fail("Attachment name not changed");
		}
		
		AttachmentDescriptor thumbnailDesc = documentDescriptor.getAttachmentDescription("thumbnail");
		if( false == newAttName.equals(thumbnailDesc.getSource()) ){
			fail("Thumbnail source not changed");
		}

		if( false == "submitted".equals(att.getStatus()) ){
			fail("Invalid status");
		}
		
		att.setStatus("approved");

		if( false == "approved".equals(att.getStatus()) ){
			fail("Unable to update status");
		}
	}
}
