package ca.carleton.gcrc.mail;

public class MailServletConfiguration {
	
	final static public String CONFIGURATION_KEY = "MAIL_SERVLET_CONFIGURATION";

	private MailDelivery mailDelivery;

	public MailDelivery getMailDelivery() {
		return mailDelivery;
	}

	public void setMailDelivery(MailDelivery mailDelivery) {
		this.mailDelivery = mailDelivery;
	}
}
