package ca.carleton.gcrc.pgSync;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class PgSyncServletConfiguration {

	final static public String CONFIGURATION_KEY = "PG_SYNC_CONFIGURATION";

	private CouchDb couchDb;
	private CouchDesignDocument atlasDesignDocument;
	private String postgresUser;
	private String postgresPass;
	private String postgresHost;
	private String postgresPort;
	private String postgresDb;
	private boolean postgresRecreateOnStart;
	private boolean postgresUpdateOnChange;

	public boolean shouldPostgresUpdateOnChange() {
		return postgresUpdateOnChange;
	}

	public void setPostgresUpdateOnChange(Boolean postgresUpdateOnChange) {
		this.postgresUpdateOnChange = postgresUpdateOnChange;
	}

	public boolean shouldPostgresRecreateOnStart() {
		return postgresRecreateOnStart;
	}

	public void setPostgresRecreateOnStart(Boolean postgresRecreateOnStart) {
		this.postgresRecreateOnStart = postgresRecreateOnStart;
	}

	public String getPostgresUser() {
		return postgresUser;
	}

	public void setPostgresUser(String postgresUser) {
		this.postgresUser = postgresUser;
	}

	public String getPostgresPass() {
		return postgresPass;
	}

	public void setPostgresPass(String postgresPass) {
		this.postgresPass = postgresPass;
	}

	public String getPostgresHost() {
		return postgresHost;
	}

	public void setPostgresHost(String postgresHost) {
		this.postgresHost = postgresHost;
	}

	public String getPostgresPort() {
		return postgresPort;
	}

	public void setPostgresPort(String postgresPort) {
		this.postgresPort = postgresPort;
	}

	public String getPostgresDb() {
		return postgresDb;
	}

	public void setPostgresDb(String postgresDb) {
		this.postgresDb = postgresDb;
	}

	public String getPgConnectString() {
		if (postgresDb != null && !postgresDb.isEmpty() &&
				postgresHost != null && !postgresHost.isEmpty()) {
			return "jdbc:postgresql://" + postgresHost + ":" + postgresPort + "/" + postgresDb;
		} else if(postgresDb != null && !postgresDb.isEmpty()) {
			return "jdbc:postgresql:" + postgresDb;
		} else {
			return "jdbc:postgresql:/";
		}

	}

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

	public boolean isPostgresEnabled() {
		return postgresDb != null && !postgresDb.isEmpty();
	}
}
