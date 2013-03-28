package ca.carleton.gcrc.couch.onUpload.mail;

public interface MailNotification {

	void uploadNotification( String docId, String attachmentName ) throws Exception;

	void sendVetterDailyNotification(int count) throws Exception;
}
