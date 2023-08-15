package ca.carleton.gcrc.couch.submission.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class DocumentCreatedGenerator implements MailMessageGenerator {

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters
			) throws Exception {

		String docId = parameters.get("submissionDocId");
		String schemaName = parameters.get("schemaName");

		// Subject
		if( null == docId ) {
			message.setSubject("Document created - <unknown>");
		} else {
			message.setSubject("Document created - "+docId);
		}

		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Document Created</title></head><body><h1>Document Created</h1>");

		pw.println("<p>A new document has been created for schema: "+schemaName+".</p>");

		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
