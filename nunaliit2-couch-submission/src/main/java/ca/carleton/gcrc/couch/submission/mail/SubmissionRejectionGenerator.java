package ca.carleton.gcrc.couch.submission.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class SubmissionRejectionGenerator implements MailMessageGenerator {

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters
			) throws Exception {
		
		String submissionDocId = parameters.get("submissionDocId");
		String rejectionReason = parameters.get("rejectionReason");
		
		// Subject
		if( null == submissionDocId ) {
			message.setSubject("Submission Rejected - <unknown>");
		} else {
			message.setSubject("Submission Rejected - "+submissionDocId);
		}
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Submission Rejected</title></head><body><h1>Submission Rejected</h1>");
		pw.println("<p>Your submission to the database was rejected.</p>");
		
		if( null != rejectionReason 
		 && false == "".equals(rejectionReason) ) {
			pw.println("<p>A reason for the rejection was provied: "+rejectionReason+"</p>");
		} else {
			pw.println("<p>There was not a specified reason for the rejection.</p>");
		}
		
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
