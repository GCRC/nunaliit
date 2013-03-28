package ca.carleton.gcrc.couch.onUpload.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.Vector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.user.UserDesignDocument;
import ca.carleton.gcrc.couch.user.UserDesignDocumentImpl;
import ca.carleton.gcrc.couch.user.UserDocument;

public class MailNotificationImpl implements MailNotification {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String atlasName = null;
	private MailDelivery mailDelivery = null;
//	private CouchDb couchDb = null;
	private UserDesignDocument userDesignDocument;

	private Properties mailProperties = null;
	private boolean sendUploadMailNotification = false;
	private String approvalPageLink = null;
	
	public MailNotificationImpl(
		String atlasName
		,MailDelivery mailDelivery
		,CouchDb couchDb
		) throws Exception {
		
		this.atlasName = atlasName;
		this.mailDelivery = mailDelivery;
//		this.couchDb = couchDb;
		
		// Set up user database access
		CouchClient couchClient = couchDb.getClient();
		userDesignDocument = UserDesignDocumentImpl.getUserDesignDocument(couchClient);
	}

	public MailNotificationImpl(
			String atlasName
			,MailDelivery mailDelivery
			,UserDesignDocument userDesignDocument
			) throws Exception {
			
			this.atlasName = atlasName;
			this.mailDelivery = mailDelivery;
			this.userDesignDocument = userDesignDocument;
		}

	public Properties getMailProperties() {
		return mailProperties;
	}

	public void setMailProperties(Properties mailProperties) throws Exception {
		this.mailProperties = mailProperties;
		
		Set<String> propertyNames = mailProperties.stringPropertyNames();
		for(String propName : propertyNames) {
			try {
				if( "upload.approval.url".equals(propName) ) {
					approvalPageLink = mailProperties.getProperty(propName);
					logger.info("approvalPageLink: "+approvalPageLink);
					
				} else if( "upload.sendNotification".equals(propName) ) {
					sendUploadMailNotification = Boolean.parseBoolean( mailProperties.getProperty(propName) );
					logger.info("sendUploadMailNotification: "+sendUploadMailNotification);
				}
			} catch(Exception e) {
				throw new Exception("Problem while parsing key: "+propName, e);
			}
		}
	}
	
	@Override
	public void uploadNotification(
			String docId
			,String attachmentName
			) throws Exception {

		if( false == sendUploadMailNotification ) {
			logger.debug("Upload notification disabled");
			return;
		}
		
		// Get list of users to receive notification
		List<UserDocument> users = new Vector<UserDocument>();
		{
			List<String> roles = new ArrayList<String>(2);
			roles.add("vetter"); // global vetters
			roles.add(atlasName+"_vetter"); // atlas vetters
			
			Collection<UserDocument> usersWithRoles = userDesignDocument.getUsersWithRoles(roles);
			for(UserDocument user : usersWithRoles){
				logger.debug("User: "+user);
				if( user.isReceivingVetterInstantNotifications() ){
					users.add(user);
				}
			}
		}

		// Get list of recipients
		List<MailRecipient> recipients = new ArrayList<MailRecipient>(users.size());
		for(UserDocument user : users){
			String display = user.getDisplayName();
			Collection<String> emails = user.getEmails();
			for(String email : emails){
				if( null == display ) {
					recipients.add( new MailRecipient(email) );
				} else {
					recipients.add( new MailRecipient(email,display) );
				}
			}
		}
		
		// Check if anything to do
		if( recipients.size() < 1 ) {
			logger.info("Upload notification not sent because there are no recipients");
			return;
		}

		logger.info("Sending mail notification for "+docId+" to "+recipients);
		
		try {
			MailMessage message = new MailMessage();
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Subject
			message.setSubject("Uploaded Media - "+docId);
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Upload Notification</title></head><body><h1>Upload Notification</h1>");
			pw.println("<p>A media was uploaded to the atlas with the following details:</p>");
			pw.println("<table>");
			pw.println("<tr><td>ID</td><td>"+docId+"</td></tr>");
			pw.println("<tr><td>Attachment</td><td>"+attachmentName+"</td></tr>");
			pw.println("</table>");
			if( null != approvalPageLink ) {
				pw.println("<p>The page where uploaded media can be approved is located at: <a href=\""+approvalPageLink+"\">"+approvalPageLink+"</a></p>");
			}
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send upload mail notification",e);
			throw new Exception("Unable to send upload mail notification",e);
		}
	}

	@Override
	public void sendVetterDailyNotification(int count) throws Exception {

		if( false == sendUploadMailNotification ) {
			logger.debug("Daily vetter notification disabled");
			return;
		}

		if( count < 1 ) {
			logger.info("No daily vetter notifications sent, since there are no pending files");
			return;
		}
		
		// Get list of users to receive notification
		List<UserDocument> users = new Vector<UserDocument>();
		{
			List<String> roles = new ArrayList<String>(2);
			roles.add("vetter"); // global vetters
			roles.add(atlasName+"_vetter"); // atlas vetters
			
			Collection<UserDocument> usersWithRoles = userDesignDocument.getUsersWithRoles(roles);
			for(UserDocument user : usersWithRoles){
				logger.debug("User: "+user);
				if( user.isReceivingVetterDailyNotifications() ){
					users.add(user);
				}
			}
		}

		// Get list of recipients
		List<MailRecipient> recipients = new ArrayList<MailRecipient>(users.size());
		for(UserDocument user : users){
			String display = user.getDisplayName();
			Collection<String> emails = user.getEmails();
			for(String email : emails){
				if( null == display ) {
					recipients.add( new MailRecipient(email) );
				} else {
					recipients.add( new MailRecipient(email,display) );
				}
			}
		}
		
		// Check if anything to do
		if( recipients.size() < 1 ) {
			logger.info("Daily vetter notification not sent because there are no recipients");
			return;
		}

		logger.info("Sending daily vetter notification for "+count+" files to "+recipients);
		
		try {
			MailMessage message = new MailMessage();
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Subject
			message.setSubject("Uploaded Media - "+count+" file"+(count>1?"s":"")+" pending for approval");
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Upload Notification</title></head><body><h1>Upload Notification</h1>");
			pw.println("<p>A number of files ("+count+") were uploaded to the atlas. Your approval is required.</p>");
			if( null != approvalPageLink ) {
				pw.println("<p>The page where uploaded files can be approved is located at: <a href=\""+approvalPageLink+"\">"+approvalPageLink+"</a></p>");
			}
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send daily vetter notification",e);
			throw new Exception("Unable to send daily vetter notification",e);
		}
	}

}
