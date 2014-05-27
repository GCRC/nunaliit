package ca.carleton.gcrc.couch.user.agreement;

import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class AgreementRobotThread extends Thread {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private String atlasName = null;
	private CouchDesignDocument documentDbDesignDocument;
	private CouchDesignDocument userDbDesignDocument;
	private String agreementRole = null;
	private String lastAgreementVersion = null;
	
	public AgreementRobotThread(AgreementRobotSettings settings) throws Exception {
		this.atlasName = settings.getAtlasName();
		this.documentDbDesignDocument = settings.getDocumentDesignDocument();
		this.userDbDesignDocument = settings.getUserDb().getDesignDocument("nunaliit_user");
		
		agreementRole = "nunaliit_agreement_atlas";
		if( null != atlasName ){
			agreementRole = "nunaliit_agreement_" + atlasName;
		}
	}
	
	public void shutdown() {
		
		logger.info("Shutting down agreement worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start agreement worker thread");
		
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
		JSONObject agreementDoc = null;
		try {
			CouchDb db = documentDbDesignDocument.getDatabase();
			boolean exist = db.documentExists("org.nunaliit.user_agreement");
			if( exist ) {
				agreementDoc = db.getDocument("org.nunaliit.user_agreement");
			} else {
				logger.error("User agreement document not found in database");
				waitMillis(60 * 1000); // wait a minute
				return;
			};
		} catch (Exception e) {
			logger.error("Error accessing user agreement document from database",e);
			waitMillis(60 * 1000); // wait a minute
			return;
		}

		// Check for work
		String version = agreementDoc.optString("_rev",null);
		if( null == version 
		 || version.equals(lastAgreementVersion) ){
			// Nothing to do, wait 30 secs
			waitMillis(30 * 1000);
			return;
		};
		
		// A new agreement is detected
		try {
			logger.info("New user agreement detected: "+version);
			performWork(agreementDoc);
			lastAgreementVersion = version;
			
		} catch(Exception e) {
			logger.error("Error handling new user agreement",e);

			// Try again in 30 secs
			waitMillis(30 * 1000);
			return;
		}
	}
	
	public void performWork(JSONObject agreementDoc) throws Exception {
		// Perform work only if the agreement is in force
		boolean agreementEnabled = AgreementUtils.getEnabledFromAgreementDocument(agreementDoc);
		if( false == agreementEnabled ){
			logger.info("User agreement is not enabled. Skip.");
			return;
		}
		
		// Check users that have agreed to the previous agreement and revoke
		// privilege
		CouchQuery query = new CouchQuery();
		query.setViewName("roles");
		query.setStartKey(agreementRole);
		query.setEndKey(agreementRole);
		
		logger.debug("Looking for users with role: "+agreementRole);
		
		CouchQueryResults results = userDbDesignDocument.performQuery(query);

		if( results.getRows().size() > 0 ) {
			// Find all acceptable agreements
			Set<String> agreementContents = 
				AgreementUtils.getContentsFromAgreementDocument(agreementDoc);
			
			for(JSONObject row : results.getRows()){
				String docId = row.optString("id","<no id>");
				try {
					verifyUser(docId, agreementContents);
				} catch(Exception e) {
					logger.error("Unable to process user: "+docId, e);
				}
			}
		}
	}

	private void verifyUser(String docId, Set<String> agreementContents) throws Exception {
		logger.debug("Verifying user: "+docId);
		
		// Get user document
		JSONObject userDoc = userDbDesignDocument.getDatabase().getDocument(docId);
		
		// Check if current agreement matches
		boolean agreementMatches = false;
		JSONObject acceptedUserAgreements = userDoc.optJSONObject("nunaliit_accepted_user_agreements");
		JSONObject atlasInfo = null;
		if( null != acceptedUserAgreements ){
			atlasInfo = acceptedUserAgreements.optJSONObject(atlasName);
		}
		String userAcceptedAgreement = null;
		if( null != atlasInfo ){
			userAcceptedAgreement = atlasInfo.optString("content","");
		}
		if( agreementContents.contains(userAcceptedAgreement) ){
			agreementMatches = true;
		}
		
		// If the agreements do not match, remove the role from this user
		boolean roleRemoved = false;
		if( !agreementMatches ){
			JSONArray roles = userDoc.optJSONArray("roles");
			JSONArray newRoles = new JSONArray();
			if( null != roles ){
				for(int i=0,e=roles.length(); i<e; ++i){
					String role = roles.getString(i);
					if( agreementRole.equals(role) ){
						roleRemoved = true;
					} else {
						newRoles.put(role);
					}
				}
			}
			if( roleRemoved ){
				userDoc.put("roles",newRoles);
			}
		}
		
		// If role was removed, update user document
		if( roleRemoved ) {
			userDbDesignDocument.getDatabase().updateDocument(userDoc);

			logger.info("User ("+docId+") must accept new agreement for atlas: "+atlasName);
		}
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
}
