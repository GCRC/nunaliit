package ca.carleton.gcrc.couch.submission.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class SubmissionAcceptedGenerator implements MailMessageGenerator {

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters) throws Exception {

		String submissionDocId = parameters.get("submissionDocId");
		String approvalMessage = parameters.get("approvalMessage");

		if (null == submissionDocId) {
			message.setSubject("Submission Approved - <unknown>");
		} else {
			message.setSubject("Submission Approved - " + submissionDocId);
		}

		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Submission Approved</title></head><body><h1>Submission Approved</h1>");
		pw.println("<p>Your submission was approved and is now available in the atlas.</p>");
		if (null != approvalMessage) {
			pw.println("<p>" + approvalMessage + "</p>");
		}
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}
}
