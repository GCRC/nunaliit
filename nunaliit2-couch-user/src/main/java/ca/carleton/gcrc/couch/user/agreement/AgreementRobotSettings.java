package ca.carleton.gcrc.couch.user.agreement;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchUserDb;

public class AgreementRobotSettings {

	private String atlasName = null;
	private CouchDesignDocument documentDesignDocument = null;
	private CouchUserDb userDb = null;

	public String getAtlasName() {
		return atlasName;
	}

	public void setAtlasName(String atlasName) {
		this.atlasName = atlasName;
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
}
