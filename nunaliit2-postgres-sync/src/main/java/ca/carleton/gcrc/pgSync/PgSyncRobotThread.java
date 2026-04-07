package ca.carleton.gcrc.pgSync;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.jdbi.v3.core.Jdbi;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class PgSyncRobotThread extends Thread implements CouchDbChangeListener {
	
	static final public int DELAY_NO_WORK_POLLING = 5 * 1000; // 5 seconds
	static final public int DELAY_NO_WORK_MONITOR = 60 * 1000; // 1 minute
	static final public int DELAY_ERROR = 60 * 1000; // 1 minute
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchDb couchDb;
	private CouchDesignDocument atlasDesign;
	private AtomicBoolean pgReloading = new AtomicBoolean(false);
	private Jdbi jdbi;
	private int noWorkDelayInMs = DELAY_NO_WORK_POLLING;
	private ConcurrentLinkedQueue<String> changeDocs;
	private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
	
	public PgSyncRobotThread(CouchDb couchDb, CouchDesignDocument atlasDesign, Jdbi jdbi) throws Exception {
		this.couchDb = couchDb;
		this.atlasDesign = atlasDesign;
		this.jdbi = jdbi;
		changeDocs = new ConcurrentLinkedQueue<String>();
		
		CouchDbChangeMonitor changeMonitor = atlasDesign.getDatabase().getChangeMonitor();
		if( null != changeMonitor ){
			changeMonitor.addChangeListener(this);
		}
		Runnable syncAllDocsTask = () -> { syncAllDocs(); };
		scheduler.scheduleAtFixedRate(syncAllDocsTask, 0,4, TimeUnit.HOURS);

	}
	
	public void shutdown() {
		
		logger.info("Shutting down pg sync worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start postgres sync worker thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("postgres sync thread exiting");
	}
	
	@Override
	public void change(
			CouchDbChangeListener.Type type
			,String docId
			,String rev
			,JSONObject rawChange
			,JSONObject doc) {
		synchronized(this){
			logger.info("Doc changed " + docId);
			changeDocs.add(docId);
		}
	}

	private void syncAllDocs() {
		pgReloading.set(true);
		logger.info("Syncing all docs to postgres");
		jdbi.useHandle(handle -> {
				handle.execute("TRUNCATE n2doc RESTART IDENTITY CASCADE;");
		});

		try {
			CouchQuery schemaQuery = new CouchQuery();
			schemaQuery.setViewName("schemas-root");
			CouchQueryResults results;
			schemaQuery.setIncludeDocs(false);
			results = atlasDesign.performQuery(schemaQuery);

			Set<String> schemas = new HashSet<String>();
			for (JSONObject row : results.getRows()) {
				String docId = row.optString("id");
				String key = row.optString("key");
				if (null != docId && !docId.startsWith("org.nunaliit")) {
					schemas.add(key);
				}
			}

			// Loop over schemas and sync docs to postgres
			for (String schemaName : schemas) {
				CouchQuery query = new CouchQuery();
				query.setViewName("nunaliit-schema");
				query.setStartKey(schemaName);
				query.setEndKey(schemaName);
				query.setIncludeDocs(false);

				CouchQueryResults docResults = atlasDesign.performQuery(query);
				jdbi.useHandle(h -> {
					for(JSONObject row : docResults.getRows()) {
						String docId = row.optString("id");
						DocumentCouchDb doc = DocumentCouchDb.documentFromCouchDb(couchDb, docId);
						if(doc != null && doc.getJSONObject() != null) {
							String geom = null;
							//can be any number, need to loop and look I guess
							Attachment geomOrig = null;
							for(Attachment a: doc.getAttachments()) {
								if(a.getName().startsWith("nunaliit2_geom_") && a.getName().endsWith("_original")) {
									geomOrig = a;
									break;
								}
							}
							if(geomOrig != null) {
								BufferedReader in = new BufferedReader(
								new InputStreamReader(geomOrig.getInputStream()));
								String inputLine;
								StringBuffer geomContent = new StringBuffer();
								while ((inputLine = in.readLine()) != null) {
									geomContent.append(inputLine);
								}
								in.close();
								geom = geomContent.toString();
							} else if(doc.getJSONObject().has("nunaliit_geom")) {
								JSONObject nunaliit_geom = doc.getJSONObject().optJSONObject("nunaliit_geom", null);
								if(nunaliit_geom != null) {
									geom = nunaliit_geom.optString("wkt", null);
								}
							}
							try {
								h.execute("INSERT INTO \"n2doc\" " +
								"(nunaliit_id, nunaliit_rev, nunaliit_schema, nunaliit_values, nunaliit_geom) values " +
								"(?, ?, ?, CAST(? AS jsonb), ST_MakeValid(ST_GeomFromText(?)))", 
								docId, doc.getRevision(), doc.getJSONObject().optString("nunaliit_schema", null), doc.getJSONObject().toString(), geom);
							} catch (Exception e) {
								logger.error("Error inserting document", e);
								logger.error(doc.getJSONObject().toString());
							}
							
						} else {
							logger.error("Failed to fetch doc with id " + docId);
						}
					}
				});
			}
		} catch (Exception e) {
			logger.error("Error syncing couchdb and postgres db", e);
			return;
		} finally {
			pgReloading.set(false);
		}
		logger.info("Done syncing all docs to postgres");
	}

	private void activity() {
		//process all documents for now, will want to change this.
		if(pgReloading.get() == false && !changeDocs.isEmpty()) {
			String changedDocId;
			while((changedDocId = changeDocs.poll()) != null) {
				logger.info("Need to fetch and pg sync doc with ID " + changedDocId);
				changedDocId = changeDocs.poll();
			}
		} else {
			waitMillis(noWorkDelayInMs);
			return;
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
