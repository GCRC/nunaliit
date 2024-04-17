package ca.carleton.gcrc.couch.onUpload.mail;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.user.UserDocument;

public interface MailNotification {

	void uploadNotification( String docId, String attachmentName ) throws Exception;

	void sendVetterDailyNotification(int count) throws Exception;

	void sendDocumentCreatedNotification(JSONObject doc, UserDocument currentUser) throws Exception;
}
