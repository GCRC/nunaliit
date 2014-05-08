package ca.carleton.gcrc.couch.submission.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class SubmissionApprovalGenerator implements MailMessageGenerator {

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters
			) throws Exception {
		
		String submissionDocId = parameters.get("submissionDocId");
		String submissionPageLink = parameters.get("submissionPageLink");
		
		// Subject
		if( null == submissionDocId ) {
			message.setSubject("Uploaded Submission - <unknown>");
		} else {
			message.setSubject("Uploaded Submission - "+submissionDocId);
		}
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Submission Notification</title></head><body><h1>Submission Notification</h1>");
		pw.println("<p>A new dataabse submission media was uploaded to the atlas, which requires your approval.</p>");
		if( null != submissionPageLink ) {
			pw.println("<p>The page where submissions can be approved is located at: <a href=\""+submissionPageLink+"\">"+submissionPageLink+"</a></p>");
		}
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
