package ca.carleton.gcrc.mail;

import ca.carleton.gcrc.mail.messageGenerator.FormEmailMessageGenerator;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class MailServletConfiguration {
	
	final static public String CONFIGURATION_KEY = "MAIL_SERVLET_CONFIGURATION";

	private String atlasName;
	private MailDelivery mailDelivery;
	private MailServiceRecipients recipients;
	private MailMessageGenerator formEmailGenerator = new FormEmailMessageGenerator();

	public String getAtlasName() {
		return atlasName;
	}

	public void setAtlasName(String atlasName) {
		this.atlasName = atlasName;
	}

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

	public MailMessageGenerator getFormEmailGenerator() {
		return formEmailGenerator;
	}

	public void setFormEmailGenerator(MailMessageGenerator formEmailGenerator) {
		this.formEmailGenerator = formEmailGenerator;
	}
}
