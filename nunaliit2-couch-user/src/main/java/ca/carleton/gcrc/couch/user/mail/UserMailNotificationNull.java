package ca.carleton.gcrc.couch.user.mail;

public class UserMailNotificationNull implements UserMailNotification {

	@Override
	public boolean isAutoRegistrationAvailable() {
		return false;
	}

	@Override
	public void sendUserCreationNotice(String emailAddress, String token) throws Exception {
	}
}
