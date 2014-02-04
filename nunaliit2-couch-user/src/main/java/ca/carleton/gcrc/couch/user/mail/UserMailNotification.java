package ca.carleton.gcrc.couch.user.mail;

public interface UserMailNotification {
	
	boolean isAutoRegistrationAvailable();
	
	void sendUserCreationNotice(String emailAddress, String token) throws Exception;
	
	void sendPasswordRecoveryNotice(String emailAddress, String token) throws Exception;
}
