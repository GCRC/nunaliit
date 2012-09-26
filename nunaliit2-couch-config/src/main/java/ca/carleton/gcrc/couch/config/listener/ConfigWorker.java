package ca.carleton.gcrc.couch.config.listener;


import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class ConfigWorker {

	private CouchDesignDocument designDocument = null;
	private ConfigWorkerThread workerThread = null;
	private String serverName;
	private ConfigListener configListener;

	public ConfigWorker() {
	}
	
	public CouchDesignDocument getDesignDocument() {
		return designDocument;
	}

	public void setDesignDocument(CouchDesignDocument designDocument) {
		this.designDocument = designDocument;
	}

	public String getServerName() {
		return serverName;
	}

	public void setServerName(String serverName) {
		this.serverName = serverName;
	}

	public ConfigListener getConfigListener() {
		return configListener;
	}

	public void setConfigListener(ConfigListener configListener) {
		this.configListener = configListener;
	}

	synchronized public void start() throws Exception {
		if( null == designDocument ) {
			throw new Exception("Design document must be specified for config worker");
		}
		if( null == serverName ) {
			throw new Exception("Server name must be specified for config worker");
		}
		if( null == configListener ) {
			throw new Exception("Config listener must be specified for config worker");
		}
		if( null != workerThread ) {
			// Already started
			return;
		}
		workerThread = new ConfigWorkerThread(designDocument, serverName, configListener);
		workerThread.start();
	}
	
	synchronized public void stop() throws Exception {
		if( null == workerThread ) {
			return;
		}
		ConfigWorkerThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join();
	}

	public void stopTimeoutMillis(int millis) throws Exception {
		if( null == workerThread ) {
			return;
		}
		ConfigWorkerThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join(millis);
		thread.interrupt();
	}
}
