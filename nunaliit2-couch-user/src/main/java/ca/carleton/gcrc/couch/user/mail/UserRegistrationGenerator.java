package ca.carleton.gcrc.couch.user.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

class UserRegistrationGenerator implements MailMessageGenerator {

    public UserRegistrationGenerator(){

	}

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String,String> parameters
			) throws Exception {

		String link = parameters.get("link");
		String userEmail = parameters.get("userEmail");

		// Subject
		message.setSubject("Nunaliit User Registration");

		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Nunaliit User Registration</title></head><body><h1>Nunaliit User Registration</h1>");
		pw.println("<p>A new user <b>" +userEmail +"</b> has been created for Nunaliit Atlas. ");
		pw.println("<p><a href=\""+link+"\">"+link+"</a></p>");
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
    }
}
