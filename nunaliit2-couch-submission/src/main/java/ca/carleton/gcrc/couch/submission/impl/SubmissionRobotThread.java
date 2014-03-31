package ca.carleton.gcrc.couch.submission.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchDocumentOptions;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.CouchUserDocContext;
import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.json.patcher.JSONPatcher;

public class SubmissionRobotThread extends Thread {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchDesignDocument submissionDbDesignDocument;
	private CouchDesignDocument documentDbDesignDocument;
	private CouchUserDb userDb;
	private Set<String> docIdsToSkip = new HashSet<String>();
	
	public SubmissionRobotThread(
			CouchDesignDocument submissionDbDesignDocument
			,CouchDesignDocument documentDbDesignDocument
			,CouchUserDb userDb
		) {
		this.submissionDbDesignDocument = submissionDbDesignDocument;
		this.documentDbDesignDocument = documentDbDesignDocument;
		this.userDb = userDb;
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
			waitMillis(60 * 1000); // wait a minute
			return;
		}

		// Check for work
		String docId = null;
		for(JSONObject row : results.getRows()) {
			String id = row.optString("id");
			if( false == docIdsToSkip.contains(id) ) {
				// Found some work
				docId = id;
				break;
			}
		}

		if( null == docId ) {
			// Nothing to do, wait 4 secs
			waitMillis(4 * 1000);
			return;
		} else {
			try {
				// Handle this work
				performWork(docId);
				
			} catch(Exception e) {
				logger.error("Error processing document "+docId,e);
				docIdsToSkip.add(docId);
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
		
		// Get document id
		String docId = submissionDoc
			.getJSONObject("nunaliit_submission")
			.getJSONObject("original_reserved")
			.getString("id");
		String revision = submissionDoc
			.getJSONObject("nunaliit_submission")
			.getJSONObject("original_reserved")
			.optString("rev",null);
		
		// Get document in document database
		CouchDb documentDb = documentDbDesignDocument.getDatabase();
		JSONObject doc = null;
		try {
			doc = documentDb.getDocument(docId);
		} catch(Exception e) {
			// ignore
		}
		if( null == doc 
		 && null != revision ) {
			// Referenced document no longer exists
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "complete");
			submissionDb.updateDocument(submissionDoc);
		} else {
			String stateStr = null;
			JSONObject jsonSubmission = submissionDoc.getJSONObject("nunaliit_submission");
			stateStr = jsonSubmission.optString("state",null);
			
			if( null == stateStr ) {
				performSubmittedWork(submissionDoc, doc);
				
			} else if( "submitted".equals(stateStr) ) {
				performSubmittedWork(submissionDoc, doc);
				
			} else if( "approved".equals(stateStr) ) {
				performApprovedWork(submissionDoc, doc);

			} else {
				throw new Exception("Unexpected state for submission document: "+stateStr);
			}
		}
	}

	public void performSubmittedWork(JSONObject submissionDoc, JSONObject targetDoc) throws Exception {
		// Find roles associated with the user who submitted the change
		String userId = submissionDoc
			.getJSONObject("nunaliit_last_updated")
			.getString("name");
		CouchUserDocContext userDoc = null;
		try {
			userDoc = userDb.getUserFromName(userId);
		} catch(Exception e) {
			// Ignore if we can not find user
		}

		// Check if submission should be automatically approved
		boolean approved = false;
		if( null != userDoc ) {
			List<String> roles = userDoc.getRoles();
			for(String role : roles){
				if( "_admin".equals(role) ){
					approved = true;
					break;
				} else if( "administrator".equals(role) ){
					approved = true;
					break;
				}
			}
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
		}
	}

	public void performApprovedWork(JSONObject submissionDoc, JSONObject currentDoc) throws Exception {
		String docId = submissionDoc
			.getJSONObject("nunaliit_submission")
			.getJSONObject("original_reserved")
			.getString("id");
		boolean isDeletion = submissionDoc
			.getJSONObject("nunaliit_submission")
			.optBoolean("deletion",false);
		
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
				CouchDb couchDb = documentDbDesignDocument.getDatabase();
				CouchDocumentOptions options = new CouchDocumentOptions();
				options.setRevision(approvedVersion);
				JSONObject rootDoc = couchDb.getDocument(docId, options);
				
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
					logger.error("rootDoc: "+rootDoc);
					logger.error("submissionPatch: "+submissionPatch);
					logger.error("databasePatch: "+databasePatch);
					logger.error("no collision: "+doc1);
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
