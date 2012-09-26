package ca.carleton.gcrc.couch.export;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class ExportConfiguration {
	
	final static public String CONFIGURATION_KEY = "EXPORT_SERVICE_CONFIGURATION";

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
