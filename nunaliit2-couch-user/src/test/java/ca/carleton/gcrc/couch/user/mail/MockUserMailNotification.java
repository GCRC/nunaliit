package ca.carleton.gcrc.couch.user.mail;

public class MockUserMailNotification implements UserMailNotification {

	public String emailAddress;
	public String token;

	@Override
	public boolean isAutoRegistrationAvailable() {
		return true;
	}

	@Override
	public void sendUserCreationNotice(String emailAddress, String token) throws Exception {
		this.emailAddress = emailAddress;
		this.token = token;
	}
}
