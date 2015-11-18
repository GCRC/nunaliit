package ca.carleton.gcrc.mail;

public class MailServletConfiguration {
	
	final static public String CONFIGURATION_KEY = "MAIL_SERVLET_CONFIGURATION";

	private MailDelivery mailDelivery;
	private MailServiceRecipients recipients;

	public MailDelivery getMailDelivery() {
		return mailDelivery;
	}

	public void setMailDelivery(MailDelivery mailDelivery) {
		this.mailDelivery = mailDelivery;
	}

	public MailServiceRecipients getRecipients() {
		return recipients;
	}

	public void setRecipients(MailServiceRecipients recipients) {
		this.recipients = recipients;
	}
}
