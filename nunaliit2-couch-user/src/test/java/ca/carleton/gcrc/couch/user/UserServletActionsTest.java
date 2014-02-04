package ca.carleton.gcrc.couch.user;

import org.json.JSONObject;

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

	public void testValidatePasswordRecovery() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";
		String newPassword = "anotherPassword";

		// Create User
		MockUserRepository repository = new MockUserRepository();
		repository.addUser(name, "Test", emailAddress);
		
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		
		UserServletActions actions = new UserServletActions(repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		actions.initPasswordRecovery(emailAddress);
		
		// Check validation
		String token = mailNotification.token;
		actions.validatePasswordRecovery(token);
		
		// Complete recovery
		actions.completePasswordRecovery(token, newPassword);
		
		// Check password
		JSONObject userDoc = repository.getUserFromName(name);
		if( false == newPassword.equals(userDoc.get("password")) ){
			fail("Password was not changed");
		}
	}

	public void testInitPasswordRecoveryNoEmail() throws Exception {
		String emailAddress = "abc@company.com";

		MockUserRepository repository = new MockUserRepository();
		
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		
		UserServletActions actions = new UserServletActions(repository,mailNotification);
		actions.setServerKey(SECRET_KEY);

		try {
			actions.initPasswordRecovery(emailAddress);
			fail("Should raise an error when e-mail is not in use");
		} catch(Exception e) {
			// OK
		}
	}

	public void testValidatePasswordRecoveryNoEmail() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";

		// Create Token
		String token = null;
		{
			MockUserRepository repository = new MockUserRepository();
			repository.addUser(name, "Test", emailAddress);
			
			MockUserMailNotification mailNotification = new MockUserMailNotification();
			
			UserServletActions actions = new UserServletActions(repository,mailNotification);
			actions.setServerKey(SECRET_KEY);
			
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}

		{
			MockUserRepository repository = new MockUserRepository();
			MockUserMailNotification mailNotification = new MockUserMailNotification();
			
			UserServletActions actions = new UserServletActions(repository,mailNotification);
			actions.setServerKey(SECRET_KEY);

			try {
				actions.validatePasswordRecovery(token);
				fail("Error should be raised when e-mail address is not in use");
			} catch(Exception e) {
				// Ignore
			}
		}
	}

	public void testCompletePasswordRecoveryNoEmail() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";
		String newPassword = "anotherPassword";

		// Create Token
		String token = null;
		{
			MockUserRepository repository = new MockUserRepository();
			repository.addUser(name, "Test", emailAddress);
			
			MockUserMailNotification mailNotification = new MockUserMailNotification();
			
			UserServletActions actions = new UserServletActions(repository,mailNotification);
			actions.setServerKey(SECRET_KEY);
			
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}

		{
			MockUserRepository repository = new MockUserRepository();
			MockUserMailNotification mailNotification = new MockUserMailNotification();
			
			UserServletActions actions = new UserServletActions(repository,mailNotification);
			actions.setServerKey(SECRET_KEY);

			try {
				actions.completePasswordRecovery(token, newPassword);
				fail("Error should be raised when e-mail address is not in use");
			} catch(Exception e) {
				// Ignore
			}
		}
	}

	public void testValidatePasswordRecoveryUserUpdated() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";

		// Create repository with a user
		MockUserRepository repository = new MockUserRepository();
		repository.addUser(name, "Test", emailAddress);

		// Action Handler
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		UserServletActions actions = new UserServletActions(repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		// Create Token
		String token = null;
		{
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}
		
		// Update user
		{
			JSONObject userDoc = repository.getUserFromName(name);
			userDoc.put("dummy", "dummy");
			repository.updateUser(userDoc);
		}

		// Validating the token should fail
		try {
			actions.validatePasswordRecovery(token);
			fail("Error should be raised when user has been updated");
		} catch(Exception e) {
			// Ignore
		}
	}

	public void testPasswordRecoveryTwice() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";

		// Create repository with a user
		MockUserRepository repository = new MockUserRepository();
		repository.addUser(name, "Test", emailAddress);

		// Action Handler
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		UserServletActions actions = new UserServletActions(repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		// Create Token
		String token = null;
		{
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}
		
		// Recover password
		{
			actions.completePasswordRecovery(token, "password2");
		}

		// Validating the token should fail
		try {
			actions.completePasswordRecovery(token, "password3");
			fail("Error should be raised when token is used a second time");
		} catch(Exception e) {
			// Ignore
		}
	}
}
