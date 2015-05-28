package ca.carleton.gcrc.couch.simplifiedGeometry;

import ca.carleton.gcrc.couch.client.CouchDb;

public class SimplifiedGeometryServletConfiguration {
	
	final static public String CONFIGURATION_KEY = "SIMPLIFIED_GEOM_SERVLET_CONFIGURATION";

	private CouchDb couchDb;
	
	public CouchDb getCouchDb() {
		return couchDb;
	}
	public void setCouchDb(CouchDb couchDb) {
		this.couchDb = couchDb;
	}
}
