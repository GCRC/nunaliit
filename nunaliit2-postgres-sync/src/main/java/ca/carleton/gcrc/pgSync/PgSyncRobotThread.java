package ca.carleton.gcrc.pgSync;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class PgSyncRobotThread extends Thread implements CouchDbChangeListener {

	static final public int DELAY_NO_WORK_POLLING = 5 * 1000; // 5 seconds
	static final public int DELAY_NO_WORK_MONITOR = 60 * 1000; // 1 minute
	static final public int DELAY_ERROR = 60 * 1000; // 1 minute

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private boolean isShuttingDown = false;
	private CouchDesignDocument atlasDesign;
	private AtomicBoolean pgReloading = new AtomicBoolean(false);
	private PgSyncActions actions;
	private int noWorkDelayInMs = DELAY_NO_WORK_POLLING;
	private ConcurrentLinkedQueue<String> changeDocs;
	private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
	private int configScheduleFixedRate = -1; //TODO move to configuration
	private boolean lastSyncSuccess = true;
	private ScheduledFuture<?> scheduledPgReload;

	public PgSyncRobotThread(CouchDb couchDb, CouchDesignDocument atlasDesign, PgSyncActions actions) throws Exception {
		// this.couchDb = couchDb;
		this.atlasDesign = atlasDesign;
		this.actions = actions;
		changeDocs = new ConcurrentLinkedQueue<String>();

		CouchDbChangeMonitor changeMonitor = this.atlasDesign.getDatabase().getChangeMonitor();
		if (null != changeMonitor) {
			changeMonitor.addChangeListener(this);
		}
		Runnable syncAllDocsTask = () -> {
			this.syncAllDocs();
		};
		if(configScheduleFixedRate > 0) {
			scheduler.scheduleAtFixedRate(syncAllDocsTask, 0, configScheduleFixedRate, TimeUnit.MINUTES);
		}
	}

	public void shutdown() {

		logger.info("Shutting down pg sync worker thread");

		synchronized (this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}

	@Override
	public void run() {

		logger.info("Start postgres sync worker thread");

		boolean done = false;
		do {
			synchronized (this) {
				done = isShuttingDown;
			}
			if (false == done) {
				activity();
			}
		} while (false == done);

		logger.info("postgres sync thread exiting");
	}

	@Override
	public void change(
			CouchDbChangeListener.Type type, String docId, String rev, JSONObject rawChange, JSONObject d) {
		DocumentCouchDb doc;
		try {
			doc = actions.getDocument(docId);
		} catch (Exception e) {
			logger.error("Error fetching document " + docId + " for postgres sync");
			return;
		}
		
		synchronized (this) {
			if(doc.getJSONObject().has("nunaliit_type") && doc.getJSONObject().getString("nunaliit_type").equals("schema")) {
				if(scheduledPgReload != null && scheduledPgReload.getDelay(TimeUnit.MILLISECONDS) > 0) {
					logger.info("Doc " + docId + " changed, reload already scheduled"); //TODO change to debug
				} else {
					runSyncAllDocs(15L);
				}
			} else if (doc.getJSONObject().has("nunaliit_schema")) {
				logger.info("Secheduling reload for doc");
				logger.info(doc.getJSONObject().toString());
				scheduleDocReload(docId);
			} else {
				logger.info("Can't sync doc with id " + docId + " with type " + doc.getJSONObject().optString("nunaliit_type") + " and schema " + doc.getSchema());
			}
		}
	}

	public void runSyncAllDocs(Long delayInSeconds) {
		Runnable syncAllDocsTask = () -> {
			this.syncAllDocs();
		};
		scheduledPgReload = scheduler.schedule(syncAllDocsTask, delayInSeconds, TimeUnit.SECONDS);
	}

	public boolean getLastSyncSuccess() {
		return lastSyncSuccess;
	}

	private void scheduleDocReload(String docId) {
		Runnable reloadDocTask = () -> {
			actions.reloadDoc(docId);
		};
		scheduler.schedule(reloadDocTask,0, TimeUnit.SECONDS);
	}

	private void syncAllDocs() {
		logger.info("Syncing all docs to postgres");
		pgReloading.set(true);
		try {
			actions.syncAllDocs();
			lastSyncSuccess = true;
		} catch (Exception e) {
			logger.error("Error syncing couchdb and postgres db", e);
			lastSyncSuccess = false;
			return;
		} finally {
			pgReloading.set(false);
		}
	}

	private void activity() {
		// process all documents for now, will want to change this.
		if (pgReloading.get() == false && !changeDocs.isEmpty()) {
			String changedDocId;
			while ((changedDocId = changeDocs.poll()) != null) {
				logger.info("Need to fetch and pg sync doc with ID " + changedDocId);
				changedDocId = changeDocs.poll();
			}
		} else {
			waitMillis(noWorkDelayInMs);
			return;
		}
	}

	private boolean waitMillis(int millis) {
		synchronized (this) {
			if (true == isShuttingDown) {
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
