package ca.carleton.gcrc.couch.submission;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.submission.mail.SubmissionMailNotifier;

public class SubmissionRobotSettings {

	private String atlasName = null;
	private CouchDesignDocument submissionDesignDocument = null;
	private CouchDesignDocument documentDesignDocument = null;
	private CouchUserDb userDb = null;
	private SubmissionMailNotifier mailNotifier = null;

	public String getAtlasName() {
		return atlasName;
	}

	public CouchDesignDocument getSubmissionDesignDocument() {
		return submissionDesignDocument;
	}

	public void setAtlasName(String atlasName) {
		this.atlasName = atlasName;
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
	
	public SubmissionMailNotifier getMailNotifier() {
		return mailNotifier;
	}

	public void setMailNotifier(SubmissionMailNotifier mailNotifier) {
		this.mailNotifier = mailNotifier;
	}
}
