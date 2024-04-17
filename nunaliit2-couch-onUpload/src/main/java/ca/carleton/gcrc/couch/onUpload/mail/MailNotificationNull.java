package ca.carleton.gcrc.couch.onUpload.mail;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.user.UserDocument;

public class MailNotificationNull implements MailNotification {

	@Override
	public void uploadNotification(
			String docId, String attachmentName) throws Exception {
		// Do nothing
	}

	@Override
	public void sendVetterDailyNotification(int count) throws Exception {
		// Do nothing
	}

	@Override
	public void sendDocumentCreatedNotification(
			JSONObject doc,
			UserDocument currentUser) throws Exception {
				// Do nothing
	}
}
