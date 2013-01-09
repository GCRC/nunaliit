package ca.carleton.gcrc.nunaliit2.couch.replication;

import ca.carleton.gcrc.couch.client.CouchClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReplicationWorker {
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchClient couchClient = null;
	private ReplicationWorkerThread workerThread = null;

	public ReplicationWorker() {
	}

	public CouchClient getCouchClient() {
		return couchClient;
	}

	public void setCouchClient(CouchClient couchClient) {
		this.couchClient = couchClient;
	}

	synchronized public void start() throws Exception {
		if( null == couchClient ) {
			throw new Exception("Couch client must be specified for replication worker");
		}
		synchronized(this) {
			if( null != workerThread ) {
				// Already started
				return;
			}
			workerThread = new ReplicationWorkerThread(couchClient);
			
			// Set a default configuration
			ReplicationConfiguration config = new ReplicationConfiguration();
			config.setReplicationInterval(3600);
			workerThread.setNewConfiguration(config);
			
			workerThread.start();
		}
	}
	
	synchronized public void stop() throws Exception {
		ReplicationWorkerThread thread = null;
		synchronized(this) {
			if( null == workerThread ) {
				return;
			}
			thread = workerThread;
			workerThread = null;
		}

		thread.shutdown();
		thread.join();
	}

	public void stopTimeoutMillis(int millis) throws Exception {
		ReplicationWorkerThread thread = null;
		synchronized(this) {
			if( null == workerThread ) {
				return;
			}
			thread = workerThread;
			workerThread = null;
		}

		thread.shutdown();
		thread.join(millis);
		thread.interrupt();
	}

	public void configurationUpdated(ReplicationConfiguration config) {
		synchronized(this) {
			if( null != workerThread ) {
				workerThread.setNewConfiguration(config);
			}
		}
	}
}
