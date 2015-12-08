package ca.carleton.gcrc.mail;

import java.util.Properties;

public class MockMailDelivery implements MailDelivery {

	private MailMessage message;

	public MailMessage getMessage() {
		return message;
	}

	public void setMessage(MailMessage message) {
		this.message = message;
	}

	@Override
	public boolean isConfigured() {
		return true;
	}

	@Override
	public Properties getMailProperties() {
		return null;
	}

	@Override
	public void sendMessage(MailMessage message) throws Exception {
		this.message = message;
	}
}
