package ca.carleton.gcrc.couch.client.impl;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;

public class CouchDbChangeMonitorThread extends Thread {
	
	static final public int LONG_POLL_TIMEOUT_MS = 30 * 1000; // 30 seconds

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchContext context;
	private URL changeUrl;
	private String lastSequence;
	private List<CouchDbChangeListener> listeners = new Vector<CouchDbChangeListener>();
	
	public CouchDbChangeMonitorThread(CouchContext context, URL changeUrl) throws Exception {
		this.context = context;
		this.changeUrl = changeUrl;

		// Compute last sequence
		List<UrlParameter> parameters = new ArrayList<UrlParameter>(3);
		parameters.add( new UrlParameter("limit","1") );
		parameters.add( new UrlParameter("descending","true") );
		parameters.add( new UrlParameter("feed","normal") );
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameters(changeUrl, parameters);
		
		JSONObject response = ConnectionUtils.getJsonResource(context, effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while fetching changes: ");
		
		// In CouchDB 1.x, last_seq is an integer. In CouchDB 2.x, last_seq is a string.
		// lastSequence = response.getLong("last_seq");
		Object lastSeqObj = response.get("last_seq");
		lastSequence = convertLastSeqObj(lastSeqObj);
	}
	
	public void shutdown() {
		
		logger.info("Shutting down database change monitor thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	synchronized public void addChangeListener(CouchDbChangeListener listener){
		listeners.add(listener);
	}
	
	@Override
	public void run() {
		
		logger.info("Start database change monitor thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("Database change monitor exiting");
	}
	
	private void activity() {
		JSONObject changesDoc = null;
		try {
			changesDoc = getChanges();
		} catch (Exception e) {
			logger.error("Error accessing database changes",e);
			waitMillis(60 * 1000); // wait a minute
			return;
		}

		// Check for work
		if( null != changesDoc ){
			JSONArray results = changesDoc.optJSONArray("results");
			if( null != results ){
				for(int i=0; i<results.length(); ++i){
					JSONObject changeObj = results.optJSONObject(i);
					if( null != changeObj ){
						try {
							reportChanges(changeObj);
						} catch (Exception e) {
							logger.error("Error interpreting database changes",e);
						}
					}
				}
			}
		}
	}
	
	private JSONObject getChanges() throws Exception {
		List<UrlParameter> parameters = new ArrayList<UrlParameter>(3);
		parameters.add( new UrlParameter("since",""+lastSequence) );
		parameters.add( new UrlParameter("feed","longpoll") );
		parameters.add( new UrlParameter("timeout",""+LONG_POLL_TIMEOUT_MS) );
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameters(changeUrl, parameters);
		
		JSONObject response = ConnectionUtils.getJsonResource(context, effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while fetching changes: ");
		
		Object lastSeqObj = response.get("last_seq");
		lastSequence = convertLastSeqObj(lastSeqObj);
		
		return response;
	}
	
	private void reportChanges(JSONObject changeObj) throws Exception {
		String docId = changeObj.optString("id", null);
		boolean deleted = changeObj.optBoolean("deleted", false);
		JSONArray changes = changeObj.getJSONArray("changes");
		JSONObject change = changes.getJSONObject(0);
		String rev = change.optString("rev", null);
		
		CouchDbChangeListener.Type type = CouchDbChangeListener.Type.DOC_UPDATED;
		if( deleted ) {
			type = CouchDbChangeListener.Type.DOC_DELETED;
		
		} else if( rev.startsWith("1-") ) {
			type = CouchDbChangeListener.Type.DOC_CREATED;
		}
		
		List<CouchDbChangeListener> copyListeners = new Vector<CouchDbChangeListener>();
		synchronized (this) {
			copyListeners.addAll(listeners);
		}
		
		for(CouchDbChangeListener listener : copyListeners){
			try {
				listener.change(type, docId, rev, changeObj, null);
			} catch(Exception e) {
				// Ignore...
				logger.error("Error while reporting database change",e);
			}
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
	
	/**
	 * Converts the object "last_seq" found in the change feed to a String.
	 * In CouchDB 1.x, last_seq is an integer. In CouchDB 2.x, last_seq is a string.
	 * @param lastSeqObj Object retrieved from the change feed
	 * @return A string representing the object
	 * @throws Exception
	 */
	private String convertLastSeqObj(Object lastSeqObj) throws Exception {
		if( null == lastSeqObj ) {
			return null;
		} else if( lastSeqObj instanceof String ) {
			return (String)lastSeqObj;
		} else if( lastSeqObj instanceof Number ) {
			// Convert to string
			return "" + lastSeqObj;
		} else {
			throw new Exception("Do not know how to handle parameter 'last_seq' in change feed: "+lastSeqObj.getClass());
		}
	}
}
