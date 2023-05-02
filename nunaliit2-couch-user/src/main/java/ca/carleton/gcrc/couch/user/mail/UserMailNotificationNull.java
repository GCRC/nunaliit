package ca.carleton.gcrc.couch.user.mail;

import java.util.List;

import ca.carleton.gcrc.mail.MailRecipient;

public class UserMailNotificationNull implements UserMailNotification {

	@Override
	public boolean isAutoRegistrationAvailable() {
		return false;
	}

	@Override
	public void sendUserCreationNotice(String emailAddress, String token) throws Exception {
	}

	@Override
	public void sendUserCreationNoticeToAdmin(List<MailRecipient> recipients, String userEmail) throws Exception {
	}

	@Override
	public void sendPasswordRecoveryNotice(String emailAddress, String token) throws Exception {
	}

	@Override
	public void sendPasswordReminder(String emailAddress, String password) throws Exception {
	}
}
