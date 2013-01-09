package ca.carleton.gcrc.nunaliit2.couch.replication;

import java.util.List;

import org.json.JSONArray;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.ReplicationRequest;
import ca.carleton.gcrc.couch.client.ReplicationStatus;
import ca.carleton.gcrc.couch.client.impl.CouchUtils;

public class ReplicationWorkerThread extends Thread {
	
	final static public int DEFAULT_REPLICATION_INTERVAL = 3600; // by default, one hour
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchClient couchClient;
	private ReplicationConfiguration replicationConfig = null;
	private int replicationIntervalInSec = DEFAULT_REPLICATION_INTERVAL;
	
	protected ReplicationWorkerThread(
		CouchClient couchClient
		) {
		this.couchClient = couchClient;
	}
	
	public void shutdown() {
		
		logger.info("Shutting down replication worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	public void setNewConfiguration(ReplicationConfiguration config) {
		
		logger.info("New configuration");

		synchronized(this) {
			replicationConfig = config;
			
			if( null == replicationConfig.getReplicationInterval() ) {
				this.replicationIntervalInSec = DEFAULT_REPLICATION_INTERVAL;
			} else {
				this.replicationIntervalInSec = replicationConfig.getReplicationInterval().intValue();
			}
			
			this.notifyAll(); // wake up right away
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start replication worker thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("Replication worker thread exiting");
	}
	
	private void activity() {
		
		try {
			ReplicationConfiguration currentConfig = null;
			synchronized(this) {
				currentConfig = replicationConfig;
			}
			if( null == currentConfig ) {
				throw new Exception("No configuration provided");
			}
			
			List<ReplicationRequest> replications = currentConfig.getReplications();
			for(ReplicationRequest replication : replications) {
				performReplication(replication);
			}
			
			waitMillis(replicationIntervalInSec * 1000);
			
		} catch(Exception e) {
			logger.error("Error while performing replication activity",e);
			waitMillis(60 * 1000); // wait a minute on errors
			logger.info("Wake up after error");
		}
	}

	private void performReplication(ReplicationRequest replication) {
		try {

			// Check if active
			String source = CouchUtils.computeEffectiveDatabaseUrl(
				replication.getSourceServerUrl()
				,replication.getSourceUserName()
				,replication.getSourcePassword()
				,replication.getSourceDbName() );
			String target = CouchUtils.computeEffectiveDatabaseUrl(
				replication.getTargetServerUrl()
				,replication.getTargetUserName()
				,replication.getTargetPassword()
				,replication.getTargetDbName() );
			JSONArray activeTasks = couchClient.activeTasks();
			ReplicationStatus status = ReplicationStatus.findReplicationTask(activeTasks, source, target);
			if( null == status ) {
				logger.info("Start replication: "+replication);

				// Replication not running, start it
				couchClient.replicate(replication);
			}
			
		} catch(Exception e) {
			logger.error("Problem performing replication: "+replication, e);
		}
	}

	private boolean waitMillis(int millis) {
		synchronized(this) {
			if( true == isShuttingDown ) {
				return false;
			}
			
			try {
				this.wait(millis);
			} catch (InterruptedException e) {
				// Interrupted
				return false;
			}
		}
		
		return true;
	}
}
