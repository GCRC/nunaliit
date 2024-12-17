package ca.carleton.gcrc.couch.submission.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.CouchUserDocContext;
import ca.carleton.gcrc.couch.submission.SubmissionRobotSettings;
import ca.carleton.gcrc.couch.submission.mail.SubmissionMailNotifier;
import ca.carleton.gcrc.couch.utils.SubmissionUtils;
import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.json.patcher.JSONPatcher;
import ca.carleton.gcrc.mail.MailRecipient;
import ca.carleton.gcrc.couch.user.UserDocument;
import ca.carleton.gcrc.couch.export.SchemaCache;
import ca.carleton.gcrc.couch.export.impl.SchemaCacheCouchDb;
import ca.carleton.gcrc.couch.app.Document;

public class SubmissionRobotThread extends Thread implements CouchDbChangeListener {
	
	static final public int DELAY_NO_WORK_POLLING = 5 * 1000; // 5 seconds
	static final public int DELAY_NO_WORK_MONITOR = 60 * 1000; // 1 minute
	static final public int DELAY_ERROR = 60 * 1000; // 1 minute

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchDesignDocument submissionDbDesignDocument;
	private CouchDesignDocument documentDbDesignDocument;
	private CouchUserDb userDb;
	private SubmissionMailNotifier mailNotifier = null;
	private Set<String> docIdsToSkip = new HashSet<String>();
	private String adminRole = "administrator";
	private String vetterRole = "vetter";
	private int noWorkDelay = DELAY_NO_WORK_POLLING;
	private String atlasName = null;
	
	public SubmissionRobotThread(SubmissionRobotSettings settings) throws Exception {
		this.submissionDbDesignDocument = settings.getSubmissionDesignDocument();
		this.documentDbDesignDocument = settings.getDocumentDesignDocument();
		this.userDb = settings.getUserDb();
		this.mailNotifier = settings.getMailNotifier();
		
		if( null != settings.getAtlasName() ){
			atlasName = settings.getAtlasName();
			adminRole = settings.getAtlasName() + "_administrator";
			vetterRole = settings.getAtlasName() + "_vetter";
		}
		
		noWorkDelay = DELAY_NO_WORK_POLLING;
		CouchDbChangeMonitor changeMonitor = submissionDbDesignDocument.getDatabase().getChangeMonitor();
		if( null != changeMonitor ){
			noWorkDelay = DELAY_NO_WORK_MONITOR;
			changeMonitor.addChangeListener(this);
		}
	}
	
	public void shutdown() {
		
		logger.info("Shutting down submission worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start submission worker thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("Submission worker thread exiting");
	}
	
	private void activity() {
		CouchQuery query = new CouchQuery();
		query.setViewName("submission-work");

		CouchQueryResults results;
		try {
			results = submissionDbDesignDocument.performQuery(query);
		} catch (Exception e) {
			logger.error("Error accessing submission database",e);
			waitMillis(DELAY_ERROR); // wait a minute
			return;
		}

		// Check for work
		String docId = null;
		synchronized(this){ // protect docIdsToSkip
			for(JSONObject row : results.getRows()) {
				String id = row.optString("id");
				if( false == docIdsToSkip.contains(id) ) {
					// Found some work
					docId = id;
					break;
				}
			}
		}

		if( null == docId ) {
			// Nothing to do, wait
			waitMillis(noWorkDelay);
			return;
		} else {
			try {
				// Handle this work
				performWork(docId);
				
			} catch(Exception e) {
				logger.error("Error processing document "+docId,e);
				synchronized(this){ // protect docIdsToSkip
					docIdsToSkip.add(docId);
				}
			}
		}
	}
	
	/*
	 * submitted (robot)
	 * -> complete (if target document is deleted)
	 * -> approved (if submitted by someone who is automatically approved)
	 * -> waiting_for_approval (otherwise)
	 * 
	 * approved (robot)
	 * -> complete (if target document is deleted)
	 * -> complete (if target document can be updated automatically)
	 * -> collision (if merging to target document performs a collision)
	 * 
	 * waiting_for_approval (user)
	 * -> approved (when an administrator agrees with changes)
	 * -> denied (when an administrator disagrees with changes)
	 * 
	 * collision (user)
	 * -> resolved (when an administrator fixes the changes to avoid collision)
	 * -> denied (when administrator decides changes are no longer wanted)
	 * 
	 * resolved (robot)
	 * -> complete (if target document is deleted)
	 * -> complete (if changes are merged on target document)
	 * -> collision (if changes can not be merged on target document)
	 * 
	 * denied (user)
	 * -> approved (when administrator decides that changes are needed)
	 * 
	 * complete
	 */
	public void performWork(String submissionDocId) throws Exception {
		// Get submission document
		CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
		JSONObject submissionDoc = submissionDb.getDocument(submissionDocId);
		
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		JSONObject originalReserved = submissionInfo.optJSONObject("original_reserved");
		JSONObject submittedReserved = submissionInfo.optJSONObject("submitted_reserved");

		// Get document id and revision
		String docId = null;
		String revision = null;
		if( null != originalReserved ){
			docId = originalReserved.optString("id", null);
			revision = originalReserved.optString("rev", null);
		}
		if( null == docId && null != submittedReserved){
			docId = submittedReserved.optString("id", null);
		}
		
		// At this point, we better have a docId
		if( null == docId ){
			throw new Exception("Can not find document identifier for original document");
		}

		// Check if denial email must be sent
		boolean sendDenialEmail = false;
		JSONObject denialEmail = submissionInfo.optJSONObject("denial_email");
		if( null != denialEmail ){
			boolean requested = denialEmail.optBoolean("requested",false);
			boolean sent = denialEmail.optBoolean("sent",false);
			
			if( requested && !sent ){
				sendDenialEmail = true;
			}
		}
		
		boolean sendApprovalEmail = false;
		JSONObject approvalEmail = submissionInfo.optJSONObject("approval_email");
		if (null != approvalEmail) {
			boolean requested = approvalEmail.optBoolean("requested", false);
			boolean sent = approvalEmail.optBoolean("sent", false);

			if (requested && !sent) {
				sendApprovalEmail = true;
			}
		}
		
		// Get document in document database
		CouchDb documentDb = documentDbDesignDocument.getDatabase();
		JSONObject currentDoc = null;
		try {
			currentDoc = documentDb.getDocument(docId);
		} catch(Exception e) {
			// ignore
		}
		if( null == currentDoc 
		 && null != revision ) {
			// Referenced document no longer exists. It has been deleted.
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "complete");
			submissionDb.updateDocument(submissionDoc);
		} else {
			String stateStr = submissionInfo.optString("state",null);
			
			if( null == stateStr ) {
				performSubmittedWork(submissionDoc, currentDoc);
				
			} else if( "submitted".equals(stateStr) ) {
				performSubmittedWork(submissionDoc, currentDoc);

			} else if( "approved".equals(stateStr) ) {
				if (sendApprovalEmail) {
					performApprovalEmail(submissionDoc, currentDoc);
				}
				performApprovedWork(submissionDoc, currentDoc);

			} else if( sendDenialEmail ) {
				performDenialEmail(submissionDoc, currentDoc);

			} else {
				throw new Exception("Unexpected state for submission document: "+stateStr);
			}
		}
	}

	public void performSubmittedWork(JSONObject submissionDoc, JSONObject currentDoc) throws Exception {
		// Find roles associated with the user who submitted the change
		List<String> roles = new Vector<String>();
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		JSONArray jsonRoles = submissionInfo.optJSONArray("submitter_roles");
		if( null != jsonRoles ){
			for(int i=0,e=jsonRoles.length(); i<e; ++i){
				String role = jsonRoles.getString(i);
				roles.add(role);
			}
		}
		
		JSONObject submittedDoc = submissionInfo.optJSONObject("submitted_doc");
		JSONArray nunaliitLayers = null;
		if( null != submittedDoc ){
			nunaliitLayers = submittedDoc.optJSONArray("nunaliit_layers");
		}

		// Check if submission should be automatically approved
		boolean approved = false;
		for(String role : roles){
			if( "_admin".equals(role) ){
				approved = true;
				break;
			} else if( "administrator".equals(role) ){
				approved = true;
				break;
			} else if( "vetter".equals(role) ){
				approved = true;
				break;
			} else if( adminRole.equals(role) ){
				approved = true;
				break;
			} else if( vetterRole.equals(role) ){
				approved = true;
				break;
			}
		}
		
		// Check if all layer roles are satisfied
		if( !approved ){
			boolean atLeastOneLayer = false;
			boolean allLayerRoles = true;
			
			if( null != nunaliitLayers ){
				for(int i=0;i<nunaliitLayers.length(); ++i){
					String layerId = nunaliitLayers.optString(i, null);
					if( null != layerId ){
						if( "public".equals(layerId) ){
							//atLeastOneLayer = true;
							// Public layer, ignore
						} else if( layerId.startsWith("public_") ){
							//atLeastOneLayer = true;
							// Public layer, ignore
						} else {
							atLeastOneLayer = true;
							
							if( rolesHaveAccessToLayerId(roles, layerId) ){
								// OK
							} else {
								allLayerRoles = false;
							}
						}
					}
				}
			}

			// If the document is on a controlled layer and the user
			// has access to all those layers, the we can automatically approve
			if( atLeastOneLayer && allLayerRoles ){
				approved = true;
			};
		}

		if( approved ) {
			CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "approved");
			submissionDb.updateDocument(submissionDoc);
		} else {
			CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "waiting_for_approval");
			submissionDb.updateDocument(submissionDoc);
			
			this.mailNotifier.sendSubmissionWaitingForApprovalNotification(submissionDoc);
		}

		if (null == currentDoc) {
			String nunaliitSchema = submittedDoc.optString("nunaliit_schema");
			CouchDb couchDb = documentDbDesignDocument.getDatabase();
			SchemaCache schemaCache = new SchemaCacheCouchDb(couchDb);
			Document schemaDoc = schemaCache.getSchema(nunaliitSchema);
			if (null != schemaDoc) {
				JSONObject schemaDocObj = schemaDoc.getJSONObject();
				try {
					JSONObject definitionJson = schemaDocObj.getJSONObject("definition");
					boolean emailOnCreate = definitionJson.optBoolean("emailOnCreate", false);
					if (emailOnCreate) {
						sendDocumentCreatedEmail(submissionDoc, currentDoc);
					}
				} catch (JSONException e) {
					logger.debug(nunaliitSchema + " does not have a definition loaded");
				}
			}
		}
	}

	public void performApprovedWork(JSONObject submissionDoc, JSONObject currentDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		boolean isDeletion = submissionInfo.optBoolean("deletion",false);
		String docId = SubmissionUtils.getDocumentIdentifierFromSubmission(submissionDoc);
		
		if( null == currentDoc ) {
			// New document. Create.
			JSONObject originalDoc = SubmissionUtils.getApprovedDocumentFromSubmission(submissionDoc);
			
			CouchDb targetDb = documentDbDesignDocument.getDatabase();
			targetDb.createDocument(originalDoc);
			
			CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "complete");
			submissionDb.updateDocument(submissionDoc);
			
		} else if( isDeletion ) {
			CouchDb targetDb = documentDbDesignDocument.getDatabase();
			JSONObject toDeleteDoc = targetDb.getDocument(docId);
			targetDb.deleteDocument(toDeleteDoc);
			
			CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "complete");
			submissionDb.updateDocument(submissionDoc);
			
		} else {
			// Update
			String currentVersion = currentDoc.getString("_rev");
			
			JSONObject approvedDoc = SubmissionUtils.getApprovedDocumentFromSubmission(submissionDoc);
			String approvedVersion = approvedDoc.optString("_rev",null);
			
			if( currentVersion.equals(approvedVersion) ) {
				// No changes since approval. Simply update the document
				// database.
				CouchDb targetDb = documentDbDesignDocument.getDatabase();
				targetDb.updateDocument(approvedDoc);
				
				CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
				submissionDoc.getJSONObject("nunaliit_submission")
					.put("state", "complete");
				submissionDb.updateDocument(submissionDoc);
			} else {
				// Get document that the changes were made against
				JSONObject rootDoc = SubmissionUtils.getOriginalDocumentFromSubmission(submissionDoc);
				
				// Compute patch from submission
				JSONObject submissionPatch = JSONPatcher.computePatch(rootDoc, approvedDoc);
				JSONObject databasePatch = JSONPatcher.computePatch(rootDoc, currentDoc);
				
				// Detect collision. Apply patches in different order, if result
				// is same, then no collision
				JSONObject doc1 = JSONSupport.copyObject(rootDoc);
				JSONPatcher.applyPatch(doc1, submissionPatch);
				JSONPatcher.applyPatch(doc1, databasePatch);
				JSONObject doc2 = JSONSupport.copyObject(rootDoc);
				JSONPatcher.applyPatch(doc2, databasePatch);
				JSONPatcher.applyPatch(doc2, submissionPatch);
				if( 0 == JSONSupport.compare(doc1, doc2) ) {
					// No collision
					CouchDb targetDb = documentDbDesignDocument.getDatabase();
					targetDb.updateDocument(doc1);
					
					CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
					submissionDoc.getJSONObject("nunaliit_submission")
						.put("state", "complete");
					submissionDb.updateDocument(submissionDoc);
				} else {
					// Collision case
					CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
					submissionDoc.getJSONObject("nunaliit_submission")
						.put("state", "collision");
					submissionDb.updateDocument(submissionDoc);
				}
			}
		}
	}
	
	public void performDenialEmail(JSONObject submissionDoc, JSONObject currentDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		JSONObject denial_email = submissionInfo.getJSONObject("denial_email");
		
		// Find user that submitted the update
		String userId = submissionInfo.optString("submitter_name", null);

		// Get user document
		CouchUserDocContext userDocContext = null;
		if( null != userId ){
			try {
				userDocContext = userDb.getUserFromName(userId);
			} catch(Exception e) {
				// Ignore if we can not find user
			}
		}
		
		// Get list of e-mails
		List<String> emails = new Vector<String>();
		String userName = null;
		if( null != userDocContext ){
			JSONObject userDoc = userDocContext.getUserDoc();
			
			Set<String> validatedEmails = new HashSet<String>();
			JSONArray jsonValidated = userDoc.optJSONArray("nunaliit_validated_emails");
			if( null != jsonValidated ){
				for(int i=0; i<jsonValidated.length(); ++i){
					String email = jsonValidated.getString(i);
					validatedEmails.add(email);
				}
			}
			
			JSONArray jsonEmails = userDoc.optJSONArray("nunaliit_emails");
			if( null != jsonEmails ){
				for(int i=0; i<jsonEmails.length(); ++i){
					String email = jsonEmails.getString(i);
					if( validatedEmails.contains(email) ){
						emails.add(email);
					}
				}
			}
			
			userName = userDoc.optString("display",null);
			if( null == userName ){
				userName = userDoc.optString("name",null);
			}
		}
		
		// If no e-mails, just quit
		if( emails.size() < 1 ){
			CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
			denial_email.put("sent", true);
			submissionDb.updateDocument(submissionDoc);
			return;
		}
		
		// Convert e-mail addresses into recipient
		List<MailRecipient> recipients = new ArrayList<MailRecipient>(emails.size());
		for(String email : emails){
			MailRecipient recipient = null;
			if( null != userName ){
				recipient = new MailRecipient(email, userName);
			} else {
				recipient = new MailRecipient(email);
			}
			recipients.add(recipient);
		}
		
		// Send notification
		mailNotifier.sendSubmissionRejectionNotification(submissionDoc, recipients);

		// Remember it was sent
		CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
		denial_email.put("sent", true);
		submissionDb.updateDocument(submissionDoc);
	}

	public void performApprovalEmail(JSONObject submissionDoc, JSONObject currentDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		JSONObject approval_email = submissionInfo.getJSONObject("approval_email");

		// Find user that submitted the update
		String userId = submissionInfo.optString("submitter_name", null);

		// Get user document
		CouchUserDocContext userDocContext = null;
		if (null != userId) {
			try {
				userDocContext = userDb.getUserFromName(userId);
			} catch (Exception e) {
				// Ignore if we can not find user
			}
		}

		// Get list of e-mails
		List<String> emails = new Vector<String>();
		String userName = null;
		if (null != userDocContext) {
			JSONObject userDoc = userDocContext.getUserDoc();

			Set<String> validatedEmails = new HashSet<String>();
			JSONArray jsonValidated = userDoc.optJSONArray("nunaliit_validated_emails");
			if (null != jsonValidated) {
				for (int i = 0; i < jsonValidated.length(); ++i) {
					String email = jsonValidated.getString(i);
					validatedEmails.add(email);
				}
			}

			JSONArray jsonEmails = userDoc.optJSONArray("nunaliit_emails");
			if (null != jsonEmails) {
				for (int i = 0; i < jsonEmails.length(); ++i) {
					String email = jsonEmails.getString(i);
					if (validatedEmails.contains(email)) {
						emails.add(email);
					}
				}
			}

			userName = userDoc.optString("display", null);
			if (null == userName) {
				userName = userDoc.optString("name", null);
			}
		}

		// If no e-mails, just quit
		if (emails.size() < 1) {
			CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
			approval_email.put("sent", true);
			submissionDb.updateDocument(submissionDoc);
			return;
		}

		// Convert e-mail addresses into recipient
		List<MailRecipient> recipients = new ArrayList<MailRecipient>(emails.size());
		for (String email : emails) {
			MailRecipient recipient = null;
			if (null != userName) {
				recipient = new MailRecipient(email, userName);
			} else {
				recipient = new MailRecipient(email);
			}
			recipients.add(recipient);
		}

		// Send notification
		mailNotifier.sendSubmissionApprovalNotification(submissionDoc, recipients);

		// Remember it was sent
		CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
		approval_email.put("sent", true);
		submissionDb.updateDocument(submissionDoc);
	}

	public void sendDocumentCreatedEmail(JSONObject submissionDoc, JSONObject currentDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");

		// Find user that submitted the update
		String userId = submissionInfo.optString("submitter_name", null);

		// Get current user document
		CouchUserDocContext userDocContext = null;
		if( null != userId ){
			try {
				userDocContext = userDb.getUserFromName(userId);
			} catch(Exception e) {
				// Ignore if we can not find user
			}
		}

		UserDocument currentUser = null;

		if( null != userDocContext ){
			JSONObject userDoc = userDocContext.getUserDoc();
			currentUser = new UserDocument(userDoc);
		}

		// Send notification
		mailNotifier.sendDocumentCreatedNotification(submissionDoc, currentUser);
	}

	private boolean waitMillis(int millis) {
		synchronized(this) {
			if( true == isShuttingDown ) {
				return false;
			}
			
			try {
				this.wait(millis);
			} catch (InterruptedException e) {
				// Interrupted
				return false;
			}
		}
		
		return true;
	}

	@Override
	public void change(
			CouchDbChangeListener.Type type
			,String docId
			,String rev
			,JSONObject rawChange
			,JSONObject doc) {
		synchronized(this){
			docIdsToSkip.remove(docId);
			this.notifyAll();
		}
	}
	
	private boolean rolesHaveAccessToLayerId(List<String> roles, String layerId){
		boolean haveAccess = false;
		
		// Check global roles
		{
			String globalRole = "layer_" + layerId;
			for(String role : roles){
				if( globalRole.equals(role) ){
					haveAccess = true;
				}
			}
		}
		
		// Check atlas role
		if( !haveAccess && null != atlasName ){
			String atlasRole = atlasName + "_layer_" + layerId;
			for(String role : roles){
				if( atlasRole.equals(role) ){
					haveAccess = true;
				}
			}
		};
		
		return haveAccess;
	}
}
