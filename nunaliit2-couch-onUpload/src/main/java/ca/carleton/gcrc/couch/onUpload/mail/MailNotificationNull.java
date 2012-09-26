package ca.carleton.gcrc.couch.onUpload.mail;

public class MailNotificationNull implements MailNotification {

	@Override
	public void uploadNotification(
			String docId
			,String title
			,String description
			,String attachmentName
			) throws Exception {
		// Do nothing
	}

}
