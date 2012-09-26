package ca.carleton.gcrc.couch.config.listener;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class ConfigWorkerThread extends Thread {
	
	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchDesignDocument dd;
	private String serverName;
	private ConfigListener configListener;
	private String lastRevision;
	
	protected ConfigWorkerThread(
		CouchDesignDocument dd
		,String serverName
		,ConfigListener configListener
		) {
		this.dd = dd;
		this.serverName = serverName;
		this.configListener = configListener;
	}
	
	public void shutdown() {
		
		logger.info("Shutting down config listener worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start config listener worker thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("Config listener worker thread exiting");
	}
	
	private void activity() {
		
		try {
			CouchConfigFactory factory = new CouchConfigFactory();
			factory.setServerName(serverName);
			factory.setConfigDesign(dd);
			
			CouchConfig config = null;
			try {
				config = factory.retrieveConfigurationObject();
			} catch (Exception e) {
				throw new Exception("Error parsing configuration object: "+serverName,e);
			}
			
			try {
				if( null == lastRevision 
				 || false == lastRevision.equals( config.getRevision() )) {
					logger.info("Reporting new configuration for "+serverName);

					if( null != configListener ) {
						configListener.configurationUpdated(config);
					}
					
					lastRevision = config.getRevision();
					
				} else {
					// Nothing to do
					// Wait 60 secs until next cycle
					waitMillis(60 * 1000);
				}
			} catch(Exception e) {
				throw new Exception("Error parsing configuration object: "+serverName,e);
			}
			
		} catch(Exception e) {
			logger.error("Error while handling configuration object: "+serverName,e);
			waitMillis(60 * 1000); // wait a minute on errors
			logger.info("Restart configuration work: "+serverName,e);
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
