package ca.carleton.gcrc.mail;

import java.util.Properties;


public interface MailDelivery {
	public static final String ConfigAttributeName_MailDelivery = "MailDelivery";

	boolean isConfigured();
	
	Properties getMailProperties();
	
	void sendMessage(MailMessage message) throws Exception;
}
