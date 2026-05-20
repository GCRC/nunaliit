package ca.carleton.gcrc.pgSync;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class PgSyncRobotThread extends Thread implements CouchDbChangeListener {
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private boolean isShuttingDown = false;
	private CouchDesignDocument atlasDesign;
	private AtomicBoolean pgReloading = new AtomicBoolean(false);
	private PgSyncActions actions;
	private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
	private boolean lastSyncSuccess = true;
	private ScheduledFuture<?> scheduledPgReload;
	private Boolean shouldSyncOnChange;

	public PgSyncRobotThread(PgSyncServletConfiguration config, boolean shouldRecreate) throws Exception {
		// this.couchDb = couchDb;
		this.atlasDesign = config.getAtlasDesignDocument();
		this.shouldSyncOnChange = config.shouldPostgresSyncOnChange();

		actions = new PgSyncActions(config.getPgConnectString(), config.getPostgresUser(),
				config.getPostgresPass(), config.getCouchDb(),
				config.getAtlasDesignDocument());
		CouchDbChangeMonitor changeMonitor = this.atlasDesign.getDatabase().getChangeMonitor();
		if (null != changeMonitor) {
			changeMonitor.addChangeListener(this);
		}
		if (shouldRecreate) {
			Runnable recreateTask = () -> {
				try {
					actions.recreateBaseN2Tables();
					this.syncAllDocs();
				} catch (Exception e) {
					logger.error("Error creating postgres DB", e);
				}
			};
			scheduledPgReload = scheduler.schedule(recreateTask, 0, TimeUnit.SECONDS);
		}
	}

	public void shutdown() {
		logger.info("Shutting down pg sync worker thread");
		scheduler.shutdownNow();
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
		} while (false == done);

		try {
			scheduler.awaitTermination(60L, TimeUnit.SECONDS);
		} catch (Exception e) {
			logger.error("Error while waiting for pg sync thread shutdown", e);
		}
		logger.info("postgres sync thread exiting");
	}

	@Override
	public void change(
			CouchDbChangeListener.Type type, String docId, String rev, JSONObject rawChange, JSONObject d) {
		if (!shouldSyncOnChange) {
			return;
		}

		if (type == CouchDbChangeListener.Type.DOC_DELETED) {
			scheduleDeleteDoc(docId);
		} else {
			DocumentCouchDb doc;
			try {
				doc = actions.getDocument(docId);
			} catch (Exception e) {
				logger.error("Error fetching document " + docId + " for postgres sync");
				return;
			}

			synchronized (this) {
				if (doc.getJSONObject().has("nunaliit_type")
						&& doc.getJSONObject().getString("nunaliit_type").equals("schema")) {
					if (scheduledPgReload != null && scheduledPgReload.getDelay(TimeUnit.MILLISECONDS) > 0) {
						logger.debug("Doc " + docId + " changed, reload already scheduled");
					} else {
						// Delay for 15 seconds because usually these come in batches
						scheduleSyncAllDocs(15L);
					}
				} else if (doc.getJSONObject().has("nunaliit_schema")) {
					logger.debug("Scheduling reload for doc " + docId);
					scheduleDocReload(docId);
				} else {
					logger.info("Can't sync doc with id " + docId + " with type "
							+ doc.getJSONObject().optString("nunaliit_type") + " and schema " + doc.getSchema());
				}
			}
		}
	}

	public void scheduleSyncAllDocs(Long delayInSeconds) {
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
		scheduler.schedule(reloadDocTask, 0, TimeUnit.SECONDS);
	}

	private void scheduleDeleteDoc(String docId) {
		Runnable delDocTask = () -> {
			actions.deleteDoc(docId);
		};
		scheduler.schedule(delDocTask, 0, TimeUnit.SECONDS);
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
}
