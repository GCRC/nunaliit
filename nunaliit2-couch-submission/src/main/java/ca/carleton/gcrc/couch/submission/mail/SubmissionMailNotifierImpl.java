package ca.carleton.gcrc.couch.submission.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.Vector;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.user.UserDesignDocument;
import ca.carleton.gcrc.couch.user.UserDesignDocumentImpl;
import ca.carleton.gcrc.couch.user.UserDocument;
import ca.carleton.gcrc.mail.MailDelivery;
import ca.carleton.gcrc.mail.MailMessage;
import ca.carleton.gcrc.mail.MailRecipient;

public class SubmissionMailNotifierImpl implements SubmissionMailNotifier {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String atlasName = null;
	private MailDelivery mailDelivery = null;
	private UserDesignDocument userDesignDocument;

	private boolean sendUploadMailNotification = false;
	private MailRecipient fromAddress = null;
	private String submissionPageLink = null;

	public SubmissionMailNotifierImpl(
		String atlasName
		,MailDelivery mailDelivery
		,CouchDb couchDb
		) throws Exception {

		this.atlasName = atlasName;
		this.mailDelivery = mailDelivery;
		
		// Set up user database access
		CouchClient couchClient = couchDb.getClient();
		userDesignDocument = UserDesignDocumentImpl.getUserDesignDocument(couchClient);
	}

	public void parseMailProperties(Properties mailProperties) throws Exception {
		
		Set<String> propertyNames = mailProperties.stringPropertyNames();
		for(String propName : propertyNames) {
			try {
				if( "upload.sendNotification".equals(propName) ) {
					sendUploadMailNotification = Boolean.parseBoolean( mailProperties.getProperty(propName) );
					logger.info("sendUploadMailNotification: "+sendUploadMailNotification);
					
				} else if( "upload.sender".equals(propName) ) {
					String value = mailProperties.getProperty(propName);
					MailRecipient r = MailRecipient.parseString(value);
					fromAddress = r;
					
				} else if( "upload.submission.url".equals(propName) ) {
					submissionPageLink = mailProperties.getProperty(propName);
					logger.info("Submission Page URL: "+submissionPageLink);
				}
			} catch(Exception e) {
				throw new Exception("Problem while parsing key: "+propName, e);
			}
		}
	}
	
	@Override
	public void sendSubmissionWaitingForApprovalNotification(
			JSONObject submissionDoc) throws Exception {

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

		logger.info("Sending mail notification for "
				+submissionDoc.optString("_id", "<unknown>")
				+" to "
				+recipients
				);
		
		try {
			MailMessage message = new MailMessage();
			
			// From
			message.setFromAddress(fromAddress);
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Subject
			message.setSubject("Uploaded Submission - "+submissionDoc.optString("_id", "<unknown>"));
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Submission Notification</title></head><body><h1>Submission Notification</h1>");
			pw.println("<p>A new dataabse submission media was uploaded to the atlas, which requires your approval.</p>");
			if( null != submissionPageLink ) {
				pw.println("<p>The page where submissions can be approved is located at: <a href=\""+submissionPageLink+"\">"+submissionPageLink+"</a></p>");
			}
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send submission notification",e);
			throw new Exception("Unable to send submission notification",e);
		}
	}

	@Override
	public void sendSubmissionRejectionNotification(
			JSONObject submissionDoc,
			List<MailRecipient> recipients
			) throws Exception {

		if( false == sendUploadMailNotification ) {
			logger.debug("Rejection notification disabled");
			return;
		}
		
		// Check if anything to do
		if( recipients.size() < 1 ) {
			logger.info("Rejection notification not sent because there are no recipients");
			return;
		}
		
		String rejectionReason = null;
		JSONObject submissionInfo = submissionDoc.optJSONObject("nunaliit_submission");
		if( null != submissionInfo ){
			rejectionReason = submissionInfo.optString("denied_reason",null);
		}

		logger.info("Sending submission rejection notification for "
				+submissionDoc.optString("_id", "<unknown>")
				+" to "
				+recipients
				);
		
		try {
			MailMessage message = new MailMessage();
			
			// From
			message.setFromAddress(fromAddress);
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Subject
			message.setSubject("Submission Rejected - "+submissionDoc.optString("_id", "<unknown>"));
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Submission Rejected</title></head><body><h1>Submission Rejected</h1>");
			pw.println("<p>Your submission to the database was rejected.</p>");
			
			if( null != rejectionReason 
			 && false == "".equals(rejectionReason) ) {
				pw.println("<p>A reason for the rejection was provied: "+rejectionReason+"</p>");
			} else {
				pw.println("<p>There was not a specified reason for the rejection.</p>");
			}
			
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send submission notification",e);
			throw new Exception("Unable to send submission notification",e);
		}
	}

}
