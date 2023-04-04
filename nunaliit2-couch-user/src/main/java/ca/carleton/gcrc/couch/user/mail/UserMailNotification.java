package ca.carleton.gcrc.couch.user.mail;

import java.util.List;

import ca.carleton.gcrc.mail.MailRecipient;

public interface UserMailNotification {
	
	boolean isAutoRegistrationAvailable();
	
	void sendUserCreationNoticeToAdmin(List<MailRecipient> recipients, String userEmail) throws Exception;

	void sendUserCreationNotice(String emailAddress, String token) throws Exception;
	
	void sendPasswordRecoveryNotice(String emailAddress, String token) throws Exception;
	
	void sendPasswordReminder(String emailAddress, String password) throws Exception;
}
