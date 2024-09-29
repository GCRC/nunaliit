package ca.carleton.gcrc.couch.user.mail;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Vector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.http.client.utils.URIBuilder;

import ca.carleton.gcrc.mail.MailDelivery;
import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.MailRecipient;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class UserMailNotificationImpl implements UserMailNotification {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private MailDelivery mailDelivery;
	private boolean sendNotice = false;
	private boolean notifyAdmin = false;
	private String createUserUrl = null;
	private String userMgmtURL = null;
	private String passwordRecoveryUrl = null;
	private MailRecipient fromAddress = null;
	private MailMessageGenerator userCreationGenerator = new UserCreationGenerator();
	private MailMessageGenerator userRegistrationGenerator = new UserRegistrationGenerator();
	private MailMessageGenerator passwordRecoveryGenerator = new PasswordRecoveryGenerator();
	private MailMessageGenerator passwordReminderGenerator = new PasswordReminderGenerator();
	
	public UserMailNotificationImpl(MailDelivery mailDelivery){
		this.mailDelivery = mailDelivery;
		
		Properties props = mailDelivery.getMailProperties();
		
		// Send Notification
		{
			String value = props.getProperty("user.sendNotification",null);
			if( value != null ) {
				boolean send = Boolean.parseBoolean(value);
				if( send ){
					sendNotice = true;
				}
			}
		}
		
		// Send Notification to admin
		{
			String value = props.getProperty("admin.notify.userCreation",null);
			if( value != null ) {
				boolean send = Boolean.parseBoolean(value);
				if( send ){
					notifyAdmin = true;
				}
			}
		}

		// Sender Address
		{
			String value = props.getProperty("user.sender",null);
			if( value != null ){
				fromAddress = MailRecipient.parseString(value);
			}
		}
		
		// Creation URL
		{
			String value = props.getProperty("user.url.creation",null);
			if( value != null ){
				createUserUrl = value;
			}
		}
		
		// User management URL
		{
			String value = props.getProperty("user.url.management",null);
			if( value != null ){
				userMgmtURL = value;
			}
		}

		// Recovery URL
		{
			String value = props.getProperty("user.url.passwordRecovery",null);
			if( value != null ){
				passwordRecoveryUrl = value;
			}
		}
		
		if( sendNotice ){
			if( null == fromAddress ){
				logger.error("user.sendNotification is set but user.sender is not provided");
			}
			if( null == createUserUrl ){
				logger.error("user.sendNotification is set but user.url.creation is not provided");
			}
			if( null == passwordRecoveryUrl ){
				logger.error("user.sendNotification is set but user.url.passwordRecovery is not provided");
			}
		}
	}

	@Override
	public boolean isAutoRegistrationAvailable() {
		if( false == sendNotice ) {
			return false;
		}

		if( null == fromAddress ){
			return false;
		}
		
		if( null == createUserUrl ) {
			return false;
		}
		
		if( null == passwordRecoveryUrl ){
			return false;
		}
		
		return true;
	}

	@Override
	public void sendUserCreationNotice(String emailAddress, String token) throws Exception {

		if( false == sendNotice ) {
			throw new Exception("User creation notice are not enabled");
		}
		if( null == createUserUrl ) {
			throw new Exception("User creation URL is not provided");
		}
		
		// Get list of recipients
		List<MailRecipient> recipients = new Vector<MailRecipient>();
		recipients.add( new MailRecipient(emailAddress) );
		
		logger.info("Sending user creation notification to "+recipients);
		
		Map<String,String> parameters = new HashMap<String,String>();
		{
			// Compute link
			URIBuilder builder = new URIBuilder(createUserUrl);
			builder.addParameter("token", token);
			String link = builder.build().toString();
			parameters.put("link", link);
		}
		
		try {
			MailMessage message = new MailMessage();
			
			// From
			message.setFromAddress(fromAddress);
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			userCreationGenerator.generateMessage(message, parameters);
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send user creation notification",e);
			throw new Exception("Unable to send user creation notification",e);
		}
	}

	@Override
	public void sendUserCreationNoticeToAdmin(List<MailRecipient> recipients, String userEmail) throws Exception {

		if( true == notifyAdmin && 0 < recipients.size()) {
			logger.info("Sending user registration notification to "+recipients);
	
			Map<String,String> parameters = new HashMap<String,String>();
			{
				// Compute link
				parameters.put("link", userMgmtURL);
				parameters.put("userEmail", userEmail);
			}
	
			try {
				MailMessage message = new MailMessage();
	
				// From
				message.setFromAddress(fromAddress);
	
				// To
				for(MailRecipient recipient : recipients){
					message.addToRecipient( recipient );
				}
	
				userRegistrationGenerator.generateMessage(message, parameters);
	
				// Send message
				mailDelivery.sendMessage(message);
	
			} catch (Exception e) {
				logger.error("Unable to send user registration notification",e);
				throw new Exception("Unable to send user registration notification",e);
			}
		}
	}

	@Override
	public void sendPasswordRecoveryNotice(String emailAddress, String token) throws Exception {

		if( false == sendNotice ) {
			throw new Exception("Password recovery notices are not enabled");
		}
		if( null == passwordRecoveryUrl ) {
			throw new Exception("Password recovery URL is not provided");
		}
		
		// Get list of recipients
		List<MailRecipient> recipients = new Vector<MailRecipient>();
		recipients.add( new MailRecipient(emailAddress) );
		
		logger.info("Sending password recovery notification to "+recipients);
		
		Map<String,String> parameters = new HashMap<String,String>();
		{
			// Compute link
			URIBuilder builder = new URIBuilder(passwordRecoveryUrl);
			builder.addParameter("token", token);
			String link = builder.build().toString();
			parameters.put("link", link);
		}
		
		try {
			MailMessage message = new MailMessage();
			
			// From
			message.setFromAddress(fromAddress);
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}

			passwordRecoveryGenerator.generateMessage(message, parameters);
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send password recovery notification",e);
			throw new Exception("Unable to send password recovery notification",e);
		}
	}

	@Override
	public void sendPasswordReminder(String emailAddress, String password) throws Exception {

		if( false == sendNotice ) {
			throw new Exception("Password reminder notices are not enabled");
		}
		
		// Get list of recipients
		List<MailRecipient> recipients = new Vector<MailRecipient>();
		recipients.add( new MailRecipient(emailAddress) );
		
		logger.info("Sending password reminder notification to "+recipients);
		
		Map<String,String> parameters = new HashMap<String,String>();
		{
			parameters.put("password", password);
		}
		
		try {
			MailMessage message = new MailMessage();
			
			// From
			message.setFromAddress(fromAddress);
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			passwordReminderGenerator.generateMessage(message, parameters);
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send password reminder notification",e);
			throw new Exception("Unable to send password reminder notification",e);
		}
	}

	public MailMessageGenerator getUserCreationGenerator() {
		return userCreationGenerator;
	}

	public void setUserCreationGenerator(MailMessageGenerator userCreationGenerator) {
		this.userCreationGenerator = userCreationGenerator;
	}

	public MailMessageGenerator getPasswordRecoveryGenerator() {
		return passwordRecoveryGenerator;
	}

	public void setPasswordRecoveryGenerator(MailMessageGenerator passwordRecoveryGenerator) {
		this.passwordRecoveryGenerator = passwordRecoveryGenerator;
	}

	public MailMessageGenerator getPasswordReminderGenerator() {
		return passwordReminderGenerator;
	}

	public void setPasswordReminderGenerator(MailMessageGenerator passwordReminderGenerator) {
		this.passwordReminderGenerator = passwordReminderGenerator;
	}
	
	public MailMessageGenerator getUserRegistrationGenerator() {
		return userRegistrationGenerator;
	}

	public void setUserRegistrationGenerator(MailMessageGenerator userRegistrationGenerator) {
		this.userRegistrationGenerator = userRegistrationGenerator;
	}
}
