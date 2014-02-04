package ca.carleton.gcrc.couch.user.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URLEncoder;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.mail.MailDelivery;
import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.MailRecipient;

public class UserMailNotificationImpl implements UserMailNotification {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private MailDelivery mailDelivery;
	private boolean sendNotice = false;
	private String createUserUrl = null;
	private String passwordRecoveryUrl = null;
	
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
		
		// Creation URL
		{
			String value = props.getProperty("user.url.creation",null);
			if( value != null ){
				createUserUrl = value;
			}
		}
		
		// Creation URL
		{
			String value = props.getProperty("user.url.passwordRecovery",null);
			if( value != null ){
				passwordRecoveryUrl = value;
			}
		}
	}

	@Override
	public boolean isAutoRegistrationAvailable() {
		if( false == sendNotice ) {
			return false;
		}
		
		if( null == createUserUrl ) {
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
		
		// Compute link
		String urlEncodedToken = URLEncoder.encode(token, "UTF-8");
		String link = createUserUrl + "?token=" + urlEncodedToken;
		
		try {
			MailMessage message = new MailMessage();
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Subject
			message.setSubject("Nunaliit User Creation");
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Nunaliit User Creation</title></head><body><h1>Nunaliit User Creation</h1>");
			pw.println("<p>Someone has requested to create a user for a Nunaliit Atlas. If it");
			pw.println("<p>was you, please follow the link below to complete the registration process.</p>");
			pw.println("<p>If you did not request a user to be created, simply disregard this e-mail.</p>");
			pw.println("<p>To complete the registration process, click on the link below, or paste");
			pw.println("it in your favourite web browser.</p>");
			pw.println("<p><a href=\""+link+"\">"+link+"</a></p>");
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send user creation notification",e);
			throw new Exception("Unable to send user creation notification",e);
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
		
		// Compute link
		String urlEncodedToken = URLEncoder.encode(token, "UTF-8");
		String link = passwordRecoveryUrl + "?token=" + urlEncodedToken;
		
		try {
			MailMessage message = new MailMessage();
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Subject
			message.setSubject("Nunaliit Password Recovery");
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Nunaliit Password Recovery</title></head><body><h1>Nunaliit Password Recovery</h1>");
			pw.println("<p>A password recovery was requested for your Nunaliit account. If you");
			pw.println("<p>wish to complete the password recovery process, follow the link provided below.</p>");
			pw.println("<p>If you did not request a password recovery, simply ignore this e-mail.</p>");
			pw.println("<p>To complete password recovery, click on the link below, or paste");
			pw.println("it in your favourite web browser.</p>");
			pw.println("<p><a href=\""+link+"\">"+link+"</a></p>");
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send password recovery notification",e);
			throw new Exception("Unable to send password recovery notification",e);
		}
	}
}
