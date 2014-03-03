package ca.carleton.gcrc.mail;

import java.util.List;
import java.util.Vector;

public class MailMessage {

	private MailRecipient fromAddress = null;
	private List<MailRecipient> toRecipients = new Vector<MailRecipient>();
	private String subject = null;
	private String htmlContent;
	
	public MailMessage(){
	}
	
	public MailRecipient getFromAddress() {
		return fromAddress;
	}

	public void setFromAddress(MailRecipient fromAddress) {
		this.fromAddress = fromAddress;
	}

	public List<MailRecipient> getToRecipients() {
		return toRecipients;
	}
	
	public void addToRecipient(MailRecipient toRecipient) {
		toRecipients.add(toRecipient);
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getHtmlContent() {
		return htmlContent;
	}

	public void setHtmlContent(String htmlContent) {
		this.htmlContent = htmlContent;
	}
}
