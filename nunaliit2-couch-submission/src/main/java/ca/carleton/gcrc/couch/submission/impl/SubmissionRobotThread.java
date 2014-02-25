package ca.carleton.gcrc.couch.submission.impl;

import java.util.HashSet;
import java.util.Set;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.couch.client.CouchUserDb;

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
		query.setViewName("submission-submitted");

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
	
	public void performWork(String submissionDocId) throws Exception {
		// Get submission document
		CouchDb submissionDb = submissionDbDesignDocument.getDatabase();
		JSONObject submissionDoc = submissionDb.getDocument(submissionDocId);
		
		// Get document id
		String docId = submissionDoc
			.getJSONObject("nunaliit_submission")
			.getJSONObject("original_info")
			.getString("id");
		
		// Get document in document database
		CouchDb documentDb = documentDbDesignDocument.getDatabase();
		JSONObject doc = documentDb.getDocument(docId);
		if( null == doc ){
			// Referenced document no longer exists
			submissionDoc.getJSONObject("nunaliit_submission")
				.put("state", "complete");
			submissionDb.updateDocument(submissionDoc);
		} else {
			// Find roles associated with the user who submitted the change
			String userId = submissionDoc
				.getJSONObject("nunaliit_last_updated")
				.getString("name");
			CouchUserContext userDoc = userDb.getUserFromName(userId);
			throw new Exception("TBD");
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
