package ca.carleton.gcrc.couch.onUpload.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class DailyVetterNotificationGenerator implements MailMessageGenerator {

	public DailyVetterNotificationGenerator(){
		
	}
	
	@Override
	public void generateMessage(
			MailMessage message, 
			Map<String,String> parameters
			) throws Exception {
		
		int count = Integer.parseInt( parameters.get("count") );
		String approvalPageLink = parameters.get("approvalPageLink");
		
		// Subject
		message.setSubject("Uploaded Media - "+count+" file"+(count>1?"s":"")+" pending for approval");
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Upload Notification</title></head><body><h1>Upload Notification</h1>");
		pw.println("<p>A number of files ("+count+") were uploaded to the atlas. Your approval is required.</p>");
		if( null != approvalPageLink ) {
			pw.println("<p>The page where uploaded files can be approved is located at: <a href=\""+approvalPageLink+"\">"+approvalPageLink+"</a></p>");
		}
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
