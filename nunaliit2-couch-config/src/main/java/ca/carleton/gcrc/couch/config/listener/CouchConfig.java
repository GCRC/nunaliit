package ca.carleton.gcrc.couch.config.listener;

import java.io.File;
import java.util.List;

import ca.carleton.gcrc.couch.client.ReplicationRequest;

public interface CouchConfig {

	public String getRevision();

	public String getServer();
	
	public Integer getReplicationInterval();

	public List<ReplicationRequest> getReplications();
	
	public void uploadCronLogs(File cronLogFile) throws Exception;
}
