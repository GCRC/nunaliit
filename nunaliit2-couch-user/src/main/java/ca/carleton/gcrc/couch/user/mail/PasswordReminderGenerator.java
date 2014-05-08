package ca.carleton.gcrc.couch.user.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class PasswordReminderGenerator implements MailMessageGenerator {

	public PasswordReminderGenerator(){
		
	}

	@Override
	public void generateMessage(
			MailMessage message, 
			Map<String,String> parameters
			) throws Exception {
		
		String password = parameters.get("password");
	
		// Subject
		message.setSubject("Nunaliit Password Reminder");
		
		// Create HTML body part
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.println("<html><head><title>Nunaliit Password Reminder</title></head><body><h1>Nunaliit Password Reminder</h1>");
		pw.println("<p>You requested an e-mail with a reminder of your password to access a Nunaliit atlas.</p>");
		pw.println("<p>Your password is: "+password+"</p>");
		pw.println("</body></html>");
		pw.flush();
		message.setHtmlContent(sw.toString());
	}
}
