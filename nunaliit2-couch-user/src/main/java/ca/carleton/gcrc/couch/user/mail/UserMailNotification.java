package ca.carleton.gcrc.couch.user.mail;

public interface UserMailNotification {
	
	void sendUserCreationNotice(String emailAddress, String token) throws Exception;
}
