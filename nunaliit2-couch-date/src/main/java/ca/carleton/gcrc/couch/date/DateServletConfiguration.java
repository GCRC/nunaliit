package ca.carleton.gcrc.couch.date;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class DateServletConfiguration {
	
	final static public String CONFIGURATION_KEY = "DATE_SERVLET_CONFIGURATION";

	private CouchDb couchDb;
	private CouchDesignDocument atlasDesignDocument;
	
	public CouchDb getCouchDb() {
		return couchDb;
	}
	public void setCouchDb(CouchDb couchDb) {
		this.couchDb = couchDb;
	}
	
	public CouchDesignDocument getAtlasDesignDocument() {
		return atlasDesignDocument;
	}
	public void setAtlasDesignDocument(CouchDesignDocument atlasDesign) {
		this.atlasDesignDocument = atlasDesign;
	}
}
