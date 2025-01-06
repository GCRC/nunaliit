package ca.carleton.gcrc.couch.submission.mail;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;
import java.util.HashSet;

public class SubmissionMailNotifierImpl implements SubmissionMailNotifier {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String atlasName = null;
	private MailDelivery mailDelivery = null;
	private UserDesignDocument userDesignDocument;

	private boolean sendUploadMailNotification = false;
	private MailRecipient fromAddress = null;
	private String submissionPageLink = null;
	private MailMessageGenerator approvalGenerator = new SubmissionApprovalGenerator();
	private MailMessageGenerator rejectionGenerator = new SubmissionRejectionGenerator();
	private MailMessageGenerator submissionAcceptedGenerator = new SubmissionAcceptedGenerator();
	private MailMessageGenerator documentCreatedGenerator = new DocumentCreatedGenerator();

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

	public MailMessageGenerator getApprovalGenerator() {
		return approvalGenerator;
	}

	public void setApprovalGenerator(MailMessageGenerator approvalGenerator) {
		this.approvalGenerator = approvalGenerator;
	}

	public MailMessageGenerator getRejectionGenerator() {
		return rejectionGenerator;
	}

	public void setRejectionGenerator(MailMessageGenerator rejectionGenerator) {
		this.rejectionGenerator = rejectionGenerator;
	}
	
	public MailMessageGenerator getDocumentCreatedGenerator() {
		return documentCreatedGenerator;
	}

	public void setDocumentCreatedGenerator(MailMessageGenerator documentCreatedGenerator) {
		this.documentCreatedGenerator = documentCreatedGenerator;
	}

	public MailMessageGenerator getSubmissionAcceptedGenerator() {
		return submissionAcceptedGenerator;
	}

	public void setSubmissionAcceptedGenerator(MailMessageGenerator submissionAcceptedGenerator) {
		this.submissionAcceptedGenerator = submissionAcceptedGenerator;
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
			
			// Generate message
			Map<String,String> parameters = new HashMap<String,String>();
			parameters.put("submissionDocId", submissionDoc.optString("_id",null));
			parameters.put("submissionPageLink", submissionPageLink);
			approvalGenerator.generateMessage(message, parameters);
			
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
			
			// Generate message
			Map<String,String> parameters = new HashMap<String,String>();
			parameters.put("submissionDocId", submissionDoc.optString("_id",null));
			parameters.put("submissionPageLink", submissionPageLink);
			parameters.put("rejectionReason", rejectionReason);
			rejectionGenerator.generateMessage(message, parameters);
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send submission notification",e);
			throw new Exception("Unable to send submission notification",e);
		}
	}

	@Override
	public void sendSubmissionApprovalNotification(
			JSONObject submissionDoc,
			List<MailRecipient> recipients) throws Exception {

		if (false == sendUploadMailNotification) {
			logger.debug("Email notification disabled");
			return;
		}

		if (recipients.size() < 1) {
			logger.info("Approval notification not sent because there are no recipients");
			return;
		}

		String approvalMessage = null;
		JSONObject submissionInfo = submissionDoc.optJSONObject("nunaliit_submission");
		if (null != submissionInfo) {
			approvalMessage = submissionInfo.optString("approval_message", null);
		}

		logger.info("Sending submission approval notification for "
				+ submissionDoc.optString("_id", "<unknown>")
				+ " to "
				+ recipients);

		try {
			MailMessage message = new MailMessage();

			// From
			message.setFromAddress(fromAddress);

			// To
			for (MailRecipient recipient : recipients) {
				message.addToRecipient(recipient);
			}

			// Generate message
			Map<String, String> parameters = new HashMap<String, String>();
			parameters.put("submissionDocId", submissionDoc.optString("_id", null));
			parameters.put("approvalMessage", approvalMessage);
			submissionAcceptedGenerator.generateMessage(message, parameters);

			// Send message
			mailDelivery.sendMessage(message);

		} catch (Exception e) {
			logger.error("Unable to send submission approval notification", e);
			throw new Exception("Unable to send submission approval notification", e);
		}
	}

	@Override
	public void sendDocumentCreatedNotification(
			JSONObject submissionDoc,
			UserDocument currentUser) throws Exception {

		List<UserDocument> users = new ArrayList<>();

		if (null != currentUser) {
			users.add(currentUser);
		}

		List<String> roles = new ArrayList<String>(2);
		roles.add("vetter"); // global vetters
		roles.add(atlasName + "_vetter"); // atlas vetters
		roles.add("administrator"); // global administrator
		roles.add(atlasName + "_administrator"); // atlas administrator

		users.addAll(new ArrayList<>(userDesignDocument.getUsersWithRoles(roles)));

		List<MailRecipient> recipients = new ArrayList<>();
		List<MailRecipient> bccRecipients = new ArrayList<>();

		// create a unique set to userIds, so as we don't send duplicate mail if the
		// current user has admin, or vetter roles
		Set<String> userIds = new HashSet<>();

		for (UserDocument user : users) {
			if (userIds.add(user.getId())) {
				String display = user.getDisplayName();
				if (user.getId() == currentUser.getId()) {
					// To
					for (String email : user.getEmails()) {
						recipients.add(display == null ? new MailRecipient(email) : new MailRecipient(email, display));
					}
				} else {
					// BCC everyone else
					for (String email : user.getEmails()) {
						bccRecipients
								.add(display == null ? new MailRecipient(email) : new MailRecipient(email, display));
					}
				}
			}
		}

		if (recipients.isEmpty() && bccRecipients.isEmpty()) {
			logger.info("Document created notification not sent because there are no recipients");
			return;
		}

		logger.info("Sending document created mail notification for "
				+ submissionDoc.optString("_id", "<unknown>")
				+ " to "
				+ recipients
				+ " and BCCing "
				+ bccRecipients);

		try {
			MailMessage message = new MailMessage();
			// From
			message.setFromAddress(fromAddress);

			// To
			for (MailRecipient recipient : recipients) {
				message.addToRecipient(recipient);
			}

			for (MailRecipient bcc : bccRecipients) {
				message.addBCCRecipient(bcc);
			}

			JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
			JSONObject submittedDoc = submissionInfo.optJSONObject("submitted_doc");

			// Generate message
			Map<String, String> parameters = new HashMap<String, String>();
			parameters.put("submissionDocId", submissionDoc.optString("_id", null));
			parameters.put("schemaName", submittedDoc.optString("nunaliit_schema", null));
			documentCreatedGenerator.generateMessage(message, parameters);

			// Send message
			mailDelivery.sendMessage(message);

		} catch (Exception e) {
			logger.error("Unable to send document created notification.", e);
			throw new Exception("Unable to send document created notification.", e);
		}
	}
}
