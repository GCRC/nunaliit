package ca.carleton.gcrc.couch.submission;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.submission.impl.SubmissionRobotThread;

public class SubmissionRobot {
	
	private SubmissionRobotThread workerThread = null;
	private CouchDesignDocument submissionDesignDocument = null;
	private CouchDesignDocument documentDesignDocument = null;
	private CouchUserDb userDb = null;

	public SubmissionRobot(){
	}

	public CouchDesignDocument getSubmissionDesignDocument() {
		return submissionDesignDocument;
	}

	public void setSubmissionDesignDocument(
			CouchDesignDocument submissionDesignDocument) {
		this.submissionDesignDocument = submissionDesignDocument;
	}

	public CouchDesignDocument getDocumentDesignDocument() {
		return documentDesignDocument;
	}

	public void setDocumentDesignDocument(CouchDesignDocument documentDesignDocument) {
		this.documentDesignDocument = documentDesignDocument;
	}

	public CouchUserDb getUserDb() {
		return userDb;
	}

	public void setUserDb(CouchUserDb userDb) {
		this.userDb = userDb;
	}
	
	synchronized public void start() throws Exception {
		if( null == submissionDesignDocument ) {
			throw new Exception("Submission DB design document must be specified for submission worker");
		}
		if( null == documentDesignDocument ) {
			throw new Exception("Document DB design document must be specified for submission worker");
		}
		if( null == userDb ) {
			throw new Exception("User DB must be specified for submission worker");
		}
		if( null != workerThread ) {
			// Already started
			return;
		}
		workerThread = new SubmissionRobotThread(
				submissionDesignDocument
				,documentDesignDocument
				,userDb
				);
		workerThread.start();
	}
	
	synchronized public void stop() throws Exception {
		if( null == workerThread ) {
			return;
		}
		SubmissionRobotThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join();
	}

	synchronized public void stopTimeoutMillis(int millis) throws Exception {
		if( null == workerThread ) {
			return;
		}
		SubmissionRobotThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join(millis);
		thread.interrupt();
	}

}
