package ca.carleton.gcrc.couch.onUpload.mail;

public class MailNotificationNull implements MailNotification {

	@Override
	public void uploadNotification(
			String docId
			,String attachmentName
			) throws Exception {
		// Do nothing
	}

	@Override
	public void sendVetterDailyNotification(int count) throws Exception {
		// Do nothing
	}

}
