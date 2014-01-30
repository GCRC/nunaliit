package ca.carleton.gcrc.couch.user;

import ca.carleton.gcrc.couch.user.db.MockUserRepository;
import ca.carleton.gcrc.couch.user.mail.MockUserMailNotification;
import junit.framework.TestCase;

public class UserServletActionsTest extends TestCase {

	static final private byte[] SECRET_KEY = {
		(byte)0x01, (byte)0x02, (byte)0x03, (byte)0x04, (byte)0x05, (byte)0x06, (byte)0x07, (byte)0x08
		,(byte)0x11, (byte)0x12, (byte)0x13, (byte)0x14, (byte)0x15, (byte)0x16, (byte)0x17, (byte)0x18
	};

	public void testValidateUserCreation() throws Exception {
		String emailAddress = "abc@company.com";

		MockUserMailNotification mailNotification = new MockUserMailNotification();
	
		MockUserRepository repository = new MockUserRepository();
		
		UserServletActions actions = new UserServletActions(repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		actions.initUserCreation(emailAddress);
		
		String token = mailNotification.token;
		actions.validateUserCreation(token);
	}

	public void testValidateUserCreationAlreadyExist() throws Exception {
		String emailAddress = "abc@company.com";

		MockUserMailNotification mailNotification = new MockUserMailNotification();
	
		MockUserRepository repository = new MockUserRepository();
		repository.addUser("test", "Test User", emailAddress);
		
		UserServletActions actions = new UserServletActions(repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		actions.initUserCreation(emailAddress);
		
		String token = mailNotification.token;
		
		// Should return an error
		try {
			actions.validateUserCreation(token);
			fail("Should have returned an error");
		} catch(Exception e) {
			// OK
		}
	}
}
