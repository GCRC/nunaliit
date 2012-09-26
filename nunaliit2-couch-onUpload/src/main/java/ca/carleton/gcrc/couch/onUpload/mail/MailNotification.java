package ca.carleton.gcrc.couch.onUpload.mail;

public interface MailNotification {

	void uploadNotification( String docId, String title, String description, String attachmentName ) throws Exception;
}
