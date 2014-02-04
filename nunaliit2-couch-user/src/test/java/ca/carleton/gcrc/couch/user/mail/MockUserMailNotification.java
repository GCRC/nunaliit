package ca.carleton.gcrc.couch.user.mail;

public class MockUserMailNotification implements UserMailNotification {

	public String creationEmailAddress;
	public String recoveryEmailAddress;
	public String reminderEmailAddress;
	public String password;
	public String token;

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
