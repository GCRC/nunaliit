package ca.carleton.gcrc.couch.user.mail;

import java.util.List;

import ca.carleton.gcrc.mail.MailRecipient;

public class MockUserMailNotification implements UserMailNotification {

	public String creationEmailAddress;
	public String recoveryEmailAddress;
	public String reminderEmailAddress;
	public String password;
	public String token;
	List<MailRecipient> recipients;
	public String userEmail;

	@Override
	public boolean isAutoRegistrationAvailable() {
		return true;
	}

	@Override
	public void sendUserCreationNotice(String emailAddress, String token) throws Exception {
		this.creationEmailAddress = emailAddress;
		this.token = token;
	}

	@Override
	public void sendUserCreationNoticeToAdmin(List<MailRecipient> recipients, String userEmail) throws Exception {
		this.recipients = recipients;
		this.userEmail = userEmail;
	}

	@Override
	public void sendPasswordRecoveryNotice(String emailAddress, String token) throws Exception {
		this.recoveryEmailAddress = emailAddress;
		this.token = token;
	}

	@Override
	public void sendPasswordReminder(String emailAddress, String password) throws Exception {
		this.reminderEmailAddress = emailAddress;
		this.password = password;
	}
}
