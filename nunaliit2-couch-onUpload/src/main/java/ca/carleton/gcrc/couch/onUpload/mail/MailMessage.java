package ca.carleton.gcrc.couch.onUpload.mail;

import java.util.List;
import java.util.Vector;

public class MailMessage {

	private List<MailRecipient> toRecipients = new Vector<MailRecipient>();
	private String subject = null;
	private String htmlContent;
	
	public MailMessage(){
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
