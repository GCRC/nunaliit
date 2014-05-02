package ca.carleton.gcrc.couch.user.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;

public class UserCreationGenerator implements MailMessageGenerator {

	@Override
	public void generateMessage(MailMessage message, Map<String,String> parameters) throws Exception {
		String link = parameters.get("link");
		
		// Subject
		message.setSubject("Nunaliit Password Recovery");
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Nunaliit Password Recovery</title></head><body><h1>Nunaliit Password Recovery</h1>");
		pw.println("<p>A password recovery was requested for your Nunaliit account. If you");
		pw.println("<p>wish to complete the password recovery process, follow the link provided below.</p>");
		pw.println("<p>If you did not request a password recovery, simply ignore this e-mail.</p>");
		pw.println("<p>To complete password recovery, click on the link below, or paste");
		pw.println("it in your favourite web browser.</p>");
		pw.println("<p><a href=\""+link+"\">"+link+"</a></p>");
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
