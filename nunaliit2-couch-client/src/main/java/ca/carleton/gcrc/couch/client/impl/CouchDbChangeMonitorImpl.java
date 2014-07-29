package ca.carleton.gcrc.couch.client.impl;

import java.net.URL;

import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;

public class CouchDbChangeMonitorImpl implements CouchDbChangeMonitor {

	private CouchDbImpl couchDb;
	private URL changeUrl;
	private CouchDbChangeMonitorThread thread = null;
	private boolean shuttingDown = false;
	
	public CouchDbChangeMonitorImpl(CouchDbImpl couchDb) {
		this.couchDb = couchDb;
	}
	
	@Override
	synchronized public void shutdown() {
		if( null != thread ){
			thread.shutdown();
			thread = null;
			shuttingDown = true;
		}
	}

	@Override
	synchronized public void addChangeListener(CouchDbChangeListener listener) throws Exception {
		if( !shuttingDown  ) {
			if( null == thread ){
				thread = new CouchDbChangeMonitorThread(couchDb.getContext(), getChangeUrl());
				thread.start();
			}
		
			thread.addChangeListener(listener);
		}
	}

	synchronized private URL getChangeUrl() throws Exception {
		if( null == changeUrl ){
			changeUrl = new URL(couchDb.getUrl(),"_changes");
		}
		return changeUrl;
	}
}
