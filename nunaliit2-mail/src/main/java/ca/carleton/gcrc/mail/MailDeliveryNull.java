package ca.carleton.gcrc.mail;

import java.util.Properties;

public class MailDeliveryNull implements MailDelivery {

	@Override
	public boolean isConfigured() {
		return false;
	}

	@Override
	public Properties getMailProperties() {
		return null;
	}

	@Override
	public void sendMessage(MailMessage message) throws Exception {
	}
}
