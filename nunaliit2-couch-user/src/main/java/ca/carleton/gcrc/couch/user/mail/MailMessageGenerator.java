package ca.carleton.gcrc.couch.user.mail;

import java.util.Map;

import ca.carleton.gcrc.mail.MailMessage;

public interface MailMessageGenerator {
	
	void generateMessage(MailMessage message, Map<String,String> parameters) throws Exception;
}
