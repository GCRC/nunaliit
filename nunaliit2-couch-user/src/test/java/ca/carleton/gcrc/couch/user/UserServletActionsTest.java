package ca.carleton.gcrc.couch.user;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.user.db.MockDocumentDatabase;
import ca.carleton.gcrc.couch.user.db.MockUserRepository;
import ca.carleton.gcrc.couch.user.mail.MockUserMailNotification;
import junit.framework.TestCase;

public class UserServletActionsTest extends TestCase {

	static final private String atlasName = "demo";
	static final private byte[] SECRET_KEY = {
		(byte)0x01, (byte)0x02, (byte)0x03, (byte)0x04, (byte)0x05, (byte)0x06, (byte)0x07, (byte)0x08
		,(byte)0x11, (byte)0x12, (byte)0x13, (byte)0x14, (byte)0x15, (byte)0x16, (byte)0x17, (byte)0x18
	};

	public void testValidateUserCreation() throws Exception {
		String emailAddress = "abc@company.com";

		MockUserMailNotification mailNotification = new MockUserMailNotification();
	
		MockUserRepository repository = new MockUserRepository();
		
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
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
		
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
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

	public void testCompleteUserCreation() throws Exception {
		String emailAddress = "abc@company.com";

		MockUserMailNotification mailNotification = new MockUserMailNotification();
	
		MockUserRepository repository = new MockUserRepository();
		
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		actions.initUserCreation(emailAddress);
		
		String token = mailNotification.token;

		String password = "a_password";
		actions.completeUserCreation(token,"Test",password,false,null);
		
		if( null != mailNotification.password ){
			fail("Password reminder notification was sent without being requested");
		}
	}

	public void testCompleteUserCreationSendPassword() throws Exception {
		String emailAddress = "abc@company.com";

		MockUserMailNotification mailNotification = new MockUserMailNotification();
	
		MockUserRepository repository = new MockUserRepository();
		
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		actions.initUserCreation(emailAddress);
		
		String token = mailNotification.token;

		String password = "a_password";
		actions.completeUserCreation(token,"Test",password,true,null);
		
		if( false == password.equals(mailNotification.password) ){
			fail("Password reminder notification not sent on creation");
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
		
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		actions.initPasswordRecovery(emailAddress);
		
		// Check validation
		String token = mailNotification.token;
		actions.validatePasswordRecovery(token);
		
		// Complete recovery
		actions.completePasswordRecovery(token, newPassword, false);
		
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
		
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
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
			
			UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
			actions.setServerKey(SECRET_KEY);
			
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}

		{
			MockUserRepository repository = new MockUserRepository();
			MockUserMailNotification mailNotification = new MockUserMailNotification();
			
			UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
			actions.setServerKey(SECRET_KEY);

			try {
				actions.validatePasswordRecovery(token);
				fail("Error should be raised when e-mail address is not in use");
			} catch(Exception e) {
				// Ignore
			}
		}
	}

	public void testCompletePasswordRecovery() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";
		String newPassword = "anotherPassword";

		// Set up
		MockUserRepository repository = new MockUserRepository();
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);

		// Add user
		repository.addUser(name, "Test", emailAddress);

		// Create Token
		String token = null;
		{
			actions.initPasswordRecovery(emailAddress);
			token = mailNotification.token;
		}

		actions.completePasswordRecovery(token, newPassword, false);
		
		// Check that password was changed
		JSONObject userDoc = repository.getUserFromName(name);
		if( false == newPassword.equals(userDoc.getString("password")) ){
			fail("Password was not modified");
		}
		
		if( null != mailNotification.password ){
			fail("Password reminder notice was sent without being requested");
		}
	}

	public void testCompletePasswordRecoverySendReminder() throws Exception {
		String emailAddress = "abc@company.com";
		String name = "user-111111";
		String newPassword = "anotherPassword";

		// Set up
		MockUserRepository repository = new MockUserRepository();
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);

		// Add user
		repository.addUser(name, "Test", emailAddress);

		// Create Token
		String token = null;
		{
			actions.initPasswordRecovery(emailAddress);
			token = mailNotification.token;
		}

		actions.completePasswordRecovery(token, newPassword, true);
		
		if( false == newPassword.equals(mailNotification.password) ){
			fail("Password reminder notice was not sent on password recovery");
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
			
			UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
			actions.setServerKey(SECRET_KEY);
			
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}

		{
			MockUserRepository repository = new MockUserRepository();
			MockUserMailNotification mailNotification = new MockUserMailNotification();
			
			UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
			actions.setServerKey(SECRET_KEY);

			try {
				actions.completePasswordRecovery(token, newPassword,false);
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
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
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
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);
		
		// Create Token
		String token = null;
		{
			actions.initPasswordRecovery(emailAddress);
			
			token = mailNotification.token;
		}
		
		// Recover password
		{
			actions.completePasswordRecovery(token, "password2", false);
		}

		// Validating the token should fail
		try {
			actions.completePasswordRecovery(token, "password3", false);
			fail("Error should be raised when token is used a second time");
		} catch(Exception e) {
			// Ignore
		}
	}

	public void testGeneratePassword() throws Exception {

		// Action Handler
		MockUserRepository repository = new MockUserRepository();
		MockUserMailNotification mailNotification = new MockUserMailNotification();
		UserServletActions actions = new UserServletActions(atlasName,createDocumentDb(),repository,mailNotification);
		actions.setServerKey(SECRET_KEY);

		JSONObject result = actions.generatePassword();
		
		String password = result.optString("password", null);
		if( null == password ){
			fail("password not sent back");
		}
	}
	
	private CouchDb createDocumentDb(){
		return new MockDocumentDatabase();
	}
}
