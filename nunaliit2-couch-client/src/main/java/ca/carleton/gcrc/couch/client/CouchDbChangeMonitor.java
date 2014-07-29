package ca.carleton.gcrc.couch.client;

public interface CouchDbChangeMonitor {

	void shutdown();

	void addChangeListener(CouchDbChangeListener listener) throws Exception;
}
