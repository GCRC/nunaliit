package ca.carleton.gcrc.couch.user.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class UserCreationGenerator implements MailMessageGenerator {

	public UserCreationGenerator(){
		
	}
	
	@Override
	public void generateMessage(
			MailMessage message, 
			Map<String,String> parameters
			) throws Exception {
		
		String link = parameters.get("link");
		
		// Subject
		message.setSubject("Nunaliit User Creation");
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Nunaliit User Creation</title></head><body><h1>Nunaliit User Creation</h1>");
		pw.println("<p>Someone has requested to create a user for a Nunaliit Atlas. If it");
		pw.println("was you, please follow the link below to complete the registration process.</p>");
		pw.println("<p>If you did not request a user to be created, simply disregard this e-mail.</p>");
		pw.println("<p>To complete the registration process, click on the link below, or paste");
		pw.println("it in your favourite web browser.</p>");
		pw.println("<p><a href=\""+link+"\">"+link+"</a></p>");
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}

}
