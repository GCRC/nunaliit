package ca.carleton.gcrc.couch.user;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Collection;
import java.util.Formatter;
import java.util.List;

import org.apache.commons.codec.binary.Base64;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.user.db.UserRepository;
import ca.carleton.gcrc.couch.user.error.TokenExpiredException;
import ca.carleton.gcrc.couch.user.error.UserUpdatedException;
import ca.carleton.gcrc.couch.user.mail.UserMailNotification;
import ca.carleton.gcrc.couch.user.token.CreationToken;
import ca.carleton.gcrc.couch.user.token.PasswordRecoveryToken;
import ca.carleton.gcrc.couch.user.token.Token;
import ca.carleton.gcrc.couch.user.token.TokenEncryptor;
import ca.carleton.gcrc.security.rng.RngFactory;

public class UserServletActions {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private UserRepository userRepository;
	private UserMailNotification userMailNotification;
	private byte[] serverKey = null;
	private JSONObject cached_welcome = null;
	private SecureRandom rng = null;

	public UserServletActions(
			UserRepository userRepository
			,UserMailNotification userMailNotification
		){
		this.userRepository = userRepository;
		this.userMailNotification = userMailNotification;
		
		rng = (new RngFactory()).createRng();
		
		// Hard coded key
		
	}
	
	public void setServerKey(byte[] serverKey){
		this.serverKey = serverKey;
	}
	
	synchronized public JSONObject getWelcome() throws Exception{
		if( null == cached_welcome ){
			cached_welcome = new JSONObject();
			cached_welcome.put("UserServlet", true);
			
			if( null != serverKey
			 && null != userMailNotification
			 && userMailNotification.isAutoRegistrationAvailable() ){
				cached_welcome.put("autoRegistration", true);
			} else {
				cached_welcome.put("autoRegistration", false);
			}
		}
		
		return cached_welcome;
	}

	public JSONObject getUser(String name) throws Exception {
		JSONObject userDoc = userRepository.getUserFromName(name);
		
		JSONObject result = getPublicUserFromUser(userDoc);
		
		return result;
	}

	public JSONObject getUsers(List<String> names) throws Exception {
		Collection<JSONObject> userDocs = userRepository.getUsersFromNames(names);
		
		JSONObject result = new JSONObject();
		
		JSONArray userArray = new JSONArray();
		result.put("users", userArray);
		
		for(JSONObject userDoc : userDocs) {
			JSONObject pubUser = getPublicUserFromUser(userDoc);
			userArray.put(pubUser);
		}
		
		return result;
	}

	public JSONObject getUserFromEmailAddress(String emailAddress) throws Exception {
		JSONObject doc = userRepository.getUserFromEmailAddress(emailAddress);
		JSONObject result = getPublicUserFromUser(doc);
		return result;
	}
	
	public JSONObject initUserCreation(String emailAddr) throws Exception {
		JSONObject result = new JSONObject();
		result.put("message", "User creation email was sent to the given address");

		// Create token
		CreationToken creationToken = new CreationToken();
		{
			creationToken.setEmailAddress(emailAddr);
			long now = (new Date()).getTime();
			long thirtyDaysMs = 30L * 24L * 60L * 60L * 1000L;
			long thirtyDaysFromNowMs = now + thirtyDaysMs;
			creationToken.setExpiry( new Date(thirtyDaysFromNowMs) );
		}
		
		// Encrypt token
		if( null == serverKey ){
			throw new Exception("Server key was not installed. Configuration must be adjusted.");
		}
		byte[] context = new byte[8];
		rng.nextBytes(context);
		byte[] encryptedToken = TokenEncryptor.encryptToken(serverKey, context, creationToken);
		
		// Base 64 encode token
		String b64Token = null;
		try {
			b64Token = Base64.encodeBase64String(encryptedToken);
		} catch( Exception e ) {
			throw new Exception("Error while encoding token (b64)", e);
		}		
		
		userMailNotification.sendUserCreationNotice(emailAddr,b64Token);
		
		return result;
	}

	public JSONObject validateUserCreation(String b64Token) throws Exception {
		byte[] encryptedToken = Base64.decodeBase64(b64Token);
		Token token = TokenEncryptor.decryptToken(serverKey, encryptedToken);
		if( token instanceof CreationToken ){
			CreationToken creationToken = (CreationToken)token;
			
			Date expiry = creationToken.getExpiry();
			if( null != expiry ){
				Date now = new Date();
				if( now.getTime() > expiry.getTime() ){
					throw new TokenExpiredException("Token is expired");
				}
			}
			
			// Check if user already exists
			String emailAddress = creationToken.getEmailAddress();
			if( null == emailAddress ) {
				throw new Exception("Token does not specify e-mail address");
			}
			JSONObject user = null;
			try {
				user = userRepository.getUserFromEmailAddress(emailAddress);
			} catch(Exception e) {
				// OK
			}
			if( null != user ) {
				throw new Exception("User with e-mail "+emailAddress+
						" already exists. Attempt password recovery.");
			}
			
			JSONObject result = new JSONObject();
			result.put("valid", true);
			result.put("emailAddress", creationToken.getEmailAddress());
			return result;
		} else {
			throw new Exception("Unexpected token class: "+token.getClass().getName());
		}
	}

	public JSONObject completeUserCreation(
			String b64Token, 
			String displayName, 
			String password, 
			boolean sendPasswordReminder
			) throws Exception {
		JSONObject validationResult = validateUserCreation(b64Token);
		String emailAddress = validationResult.getString("emailAddress");
		
		JSONObject result = new JSONObject();
		result.put("emailAddress", emailAddress);

		// Create a random user id
		int tries = 10;
		String name = "user" + rng.nextInt();
		while( isUserNameInUse(name) ){
			--tries;
			if( tries < 1 ) throw new Exception("Can not compute a unique user identifier. Try again.");
			name = "user" + rng.nextInt();
		}
		result.put("name", name);
		
		// Create user
		userRepository.createUser(name, displayName, password, emailAddress);
		
		// Get user
		JSONObject userDoc = userRepository.getUserFromName(name);
		JSONObject publicUserDoc = getPublicUserFromUser(userDoc);
		result.put("doc", publicUserDoc);
		
		if( sendPasswordReminder ){
			userMailNotification.sendPasswordReminder(emailAddress, password);
		}
		
		return result;
	}
	
	public JSONObject initPasswordRecovery(String emailAddr) throws Exception {
		JSONObject result = new JSONObject();
		result.put("message", "Password recovery e-mail was sent to the given address");
		
		// User exists?
		JSONObject user = null;
		try {
			user = userRepository.getUserFromEmailAddress(emailAddr);
		} catch(Exception e) {
			// Ignore
		}
		if( null == user ){
			throw new Exception("No user assciated with e-mail address: "+emailAddr);
		}

		// Create token
		PasswordRecoveryToken passwordRecoveryToken = new PasswordRecoveryToken();
		{
			passwordRecoveryToken.setEmailAddress(emailAddr);
			
			long now = (new Date()).getTime();
			long expiryPeriodInMs = 1L * 24L * 60L * 60L * 1000L; // 1 day
			long expiryTime = now + expiryPeriodInMs;
			passwordRecoveryToken.setExpiry( new Date(expiryTime) );
			
			passwordRecoveryToken.setVersion( user.getString("_rev").substring(0,5) );
		}
		
		// Encrypt token
		if( null == serverKey ){
			throw new Exception("Server key was not installed. Configuration must be adjusted.");
		}
		byte[] context = new byte[8];
		rng.nextBytes(context);
		byte[] encryptedToken = TokenEncryptor.encryptToken(serverKey, context, passwordRecoveryToken);
		
		// Base 64 encode token
		String b64Token = null;
		try {
			b64Token = Base64.encodeBase64String(encryptedToken);
		} catch( Exception e ) {
			throw new Exception("Error while encoding token (b64)", e);
		}		
		
		userMailNotification.sendPasswordRecoveryNotice(emailAddr,b64Token);
		
		return result;
	}

	public JSONObject validatePasswordRecovery(String b64Token) throws Exception {
		byte[] encryptedToken = Base64.decodeBase64(b64Token);
		Token token = TokenEncryptor.decryptToken(serverKey, encryptedToken);
		if( token instanceof PasswordRecoveryToken ){
			PasswordRecoveryToken passwordRecoveryToken = (PasswordRecoveryToken)token;
			
			// Check expiry time
			Date expiry = passwordRecoveryToken.getExpiry();
			if( null != expiry ){
				Date now = new Date();
				if( now.getTime() > expiry.getTime() ){
					throw new TokenExpiredException("Token is expired");
				}
			}
			
			// Check if user already exists
			String emailAddress = passwordRecoveryToken.getEmailAddress();
			if( null == emailAddress ) {
				throw new Exception("Token does not specify an e-mail address");
			}
			JSONObject userDoc = null;
			try {
				logger.error("userRepository: "+userRepository);
				userDoc = userRepository.getUserFromEmailAddress(emailAddress);
			} catch(Exception e) {
				logger.error("Error",e);
				throw new Exception("There is no user associated with the e-mail address: "+emailAddress+
						". You must first create a user account.",e);
			}
			
			// Verify that user document was not modified since the token was generated
			{
				String rev = userDoc.optString("_rev");
				if( null == rev ){
					throw new Exception("Revision not available from user document");
				}
				String tokenRev = passwordRecoveryToken.getVersion();
				if( null == tokenRev ){
					throw new Exception("Revision not provided in password recovery token");
				}
				if( false == tokenRev.equals( rev.substring(0, tokenRev.length()) ) ){
					throw new UserUpdatedException("Password recovery token refers to an older version of the user document");
				}
			}
			
			JSONObject result = new JSONObject();
			result.put("valid", true);
			result.put("emailAddress", passwordRecoveryToken.getEmailAddress());
			result.put("name", userDoc.getString("name"));
			return result;
		} else {
			throw new Exception("Unexpected token class: "+token.getClass().getName());
		}
	}

	public JSONObject completePasswordRecovery(
			String b64Token, 
			String newPassword, 
			boolean sendPasswordReminder 
			) throws Exception {
		JSONObject validationResult = validatePasswordRecovery(b64Token);
		String emailAddress = validationResult.getString("emailAddress");
		
		JSONObject result = new JSONObject();
		result.put("emailAddress", emailAddress);

		// Get user
		String name = validationResult.getString("name");
		result.put("name", name);
		
		// Create user
		userRepository.recoverPassword(name, newPassword);
		
		// Get user
		JSONObject userDoc = userRepository.getUserFromName(name);
		JSONObject publicUserDoc = getPublicUserFromUser(userDoc);
		result.put("doc", publicUserDoc);
		
		if( sendPasswordReminder ){
			userMailNotification.sendPasswordReminder(emailAddress, newPassword);
		}
		
		return result;
	}

	private boolean isUserNameInUse(String name) {
		JSONObject user = null;
		try {
			user = userRepository.getUserFromName(name);
		} catch(Exception e) {
			return false;
		}
		return (user != null);
	}

	private JSONObject getPublicUserFromUser(JSONObject userDoc) throws Exception {
		JSONObject result = new JSONObject();

		result.put("_id", userDoc.opt("_id"));
		result.put("_rev", userDoc.opt("_rev"));
		result.put("name", userDoc.opt("name"));
		result.put("display", userDoc.opt("display"));
		
		JSONArray emailArray = userDoc.optJSONArray("nunaliit_emails");
		if( null != emailArray ){
			JSONArray emailDigest = new JSONArray();
			
			for(int i=0,e=emailArray.length();i<e;++i){
				Object emailObj = emailArray.get(i);
				if( emailObj instanceof String ){
					String email = (String)emailObj;
					
					ByteArrayOutputStream baos = new ByteArrayOutputStream();
					OutputStreamWriter osw = new OutputStreamWriter(baos,"UTF-8");
					osw.write(email);
					osw.flush();
					
					MessageDigest md = MessageDigest.getInstance("MD5");
					md.update(baos.toByteArray());
					byte[] digest = md.digest();

					StringBuilder sb = new StringBuilder(digest.length * 2);
					Formatter formatter = new Formatter(sb);
					for (byte b : digest) {
						formatter.format("%02x", b);  
					}
					formatter.close();
					emailDigest.put( sb.toString() );  
				}
			}
			
			result.put("emailDigests", emailDigest);
		}
		
		return result;
	}
}
