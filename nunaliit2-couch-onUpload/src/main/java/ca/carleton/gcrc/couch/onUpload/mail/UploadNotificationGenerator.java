package ca.carleton.gcrc.couch.onUpload.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class UploadNotificationGenerator implements MailMessageGenerator {

	public UploadNotificationGenerator(){
		
	}
	
	@Override
	public void generateMessage(
			MailMessage message, 
			Map<String,String> parameters
			) throws Exception {
		
		String docId = parameters.get("docId");
		String attachmentName = parameters.get("attachmentName");
		String approvalPageLink = parameters.get("approvalPageLink");
		
		// Subject
		message.setSubject("Uploaded Media - "+docId);
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Upload Notification</title></head><body><h1>Upload Notification</h1>");
		pw.println("<p>A media was uploaded to the atlas with the following details:</p>");
		pw.println("<table>");
		pw.println("<tr><td>ID</td><td>"+docId+"</td></tr>");
		pw.println("<tr><td>Attachment</td><td>"+attachmentName+"</td></tr>");
		pw.println("</table>");
		if( null != approvalPageLink ) {
			pw.println("<p>The page where uploaded media can be approved is located at: <a href=\""+approvalPageLink+"\">"+approvalPageLink+"</a></p>");
		}
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
