package ca.carleton.gcrc.couch.onUpload.mail;


public interface MailDelivery {

	void sendMessage(MailMessage message) throws Exception;
}
