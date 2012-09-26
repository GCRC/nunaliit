package ca.carleton.gcrc.couch.config;

import ca.carleton.gcrc.couch.client.ReplicationRequest;
import ca.carleton.gcrc.couch.config.listener.ConfigListener;
import ca.carleton.gcrc.couch.config.listener.CouchConfig;
import ca.carleton.gcrc.nunaliit2.couch.replication.ReplicationConfiguration;
import ca.carleton.gcrc.nunaliit2.couch.replication.ReplicationWorker;

public class ReplicationConfigListener implements ConfigListener {

	private String userName;
	private String password;
	private ReplicationWorker replicationWorker;
	
	public ReplicationConfigListener(
		String userName
		,String password
		,ReplicationWorker replicationWorker			
		) {
		this.userName = userName;
		this.password = password;
		this.replicationWorker = replicationWorker;
	}
	
	@Override
	public void configurationUpdated(CouchConfig config) {
		
		ReplicationConfiguration c = new ReplicationConfiguration();
		
		c.setReplicationInterval( config.getReplicationInterval() );
		
		// Adjust user name/password
		for(ReplicationRequest request : config.getReplications()) {
			if( request.getSourceUserName() == ReplicationRequest.REMOTE_USER_NAME ) {
				request.setSourceUserName(userName);
			}
			if( request.getSourcePassword() == ReplicationRequest.REMOTE_USER_PASSWORD ) {
				request.setSourcePassword(password);
			}
			if( request.getTargetUserName() == ReplicationRequest.REMOTE_USER_NAME ) {
				request.setTargetUserName(userName);
			}
			if( request.getTargetPassword() == ReplicationRequest.REMOTE_USER_PASSWORD ) {
				request.setTargetPassword(password);
			}
			
			c.addReplication(request);
		}
		
		replicationWorker.configurationUpdated(c);
	}

}
