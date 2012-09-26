package ca.carleton.gcrc.couch.config.listener;

import java.io.File;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.ReplicationRequest;

public class CouchConfigImpl implements CouchConfig {

	private CouchDesignDocument configDesign = null;
	private JSONObject rawJsonObject = null;
	private String revision;
	private String server;
	private Integer replicationInterval = null;
	private List<ReplicationRequest> replications = new Vector<ReplicationRequest>();
	
	public CouchConfigImpl(CouchDesignDocument configDesign, JSONObject rawJsonObject) {
		this.configDesign = configDesign;
		this.rawJsonObject = rawJsonObject;
	}
	
	@Override
	public String getRevision() {
		return revision;
	}

	public void setRevision(String revision) {
		this.revision = revision;
	}

	@Override
	public String getServer() {
		return server;
	}
	
	public void setServer(String server) {
		this.server = server;
	}

	@Override
	public Integer getReplicationInterval() {
		return replicationInterval;
	}

	public void setReplicationInterval(Integer replicationInterval) {
		this.replicationInterval = replicationInterval;
	}

	@Override
	public List<ReplicationRequest> getReplications() {
		return replications;
	}
	
	public void addReplication(ReplicationRequest replication) {
		replications.add(replication);
	}

	@Override
	public void uploadCronLogs(File cronLogFile) throws Exception {
		try {
			configDesign.getDatabase().uploadAttachment(rawJsonObject, "cron.log", cronLogFile, "text/plain");
		} catch (Exception e) {
			throw new Exception("Unable to upload cron.logs to configuration object",e);
		}
	}
}
