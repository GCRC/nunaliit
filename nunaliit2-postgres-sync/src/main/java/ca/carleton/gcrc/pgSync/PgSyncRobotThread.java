package ca.carleton.gcrc.pgSync;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.Update;
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
				handle.execute("TRUNCATE n2docs RESTART IDENTITY CASCADE;");
				handle.execute("TRUNCATE n2layers RESTART IDENTITY CASCADE;");
		});

		try {
			CouchQuery schemaQuery = new CouchQuery();
			schemaQuery.setViewName("schemas-root");
			CouchQueryResults results;
			schemaQuery.setIncludeDocs(true);
			results = atlasDesign.performQuery(schemaQuery);

			Map<String, Map<String, Map<String, String>>> schemas = new HashMap<String, Map<String, Map<String, String>>>();
			for (JSONObject row : results.getRows()) {
				String docId = row.optString("id");
				String key = row.optString("key");
				if (null != docId && !docId.startsWith("org.nunaliit")) {
					JSONObject def = null;
					Map<String, Map<String, String>> pgCols = new HashMap<String, Map<String, String>>();
					// no_of_employee: {
					// 	valueKey: 'no_of_employee',
					// 	pgType: 'TEXT'
					// }
					if(row.has("doc") && row.getJSONObject("doc").has("definition.json")) {
						def = new JSONObject(row.getJSONObject("doc").getString("definition.json"));
					} else if(row.has("doc") && row.getJSONObject("doc").has("definition")) {
						def = row.getJSONObject("doc").getJSONObject("definition");
					} else {
						logger.info("Missing definition for pg sync");
					}

					if(def != null) {
						JSONArray attributes = def.getJSONArray("attributes");
						for(Object a: attributes) {
							if(!(a instanceof JSONObject)) {
								logger.error("definition attributes not readable for pg sync for schema " + docId);
								continue;
							}
							JSONObject att = (JSONObject)a;
							if(!att.has("id") || !att.has("type")) { //skip non-field attributes
								continue;
							}
							String aType = att.getString("type");
							if(aType.equalsIgnoreCase("string")) {
								HashMap<String, String> colDef = new HashMap<String, String>();
								String k = att.getString("id");
								colDef.put("pgType", "TEXT");
								pgCols.put(k, colDef);
							} else if(aType.equalsIgnoreCase("localized")) {
								//TODO:
								// Putting whole sting into field now, but
								// two possible approaches here. If we know the languages then
								//can create multiple columns (key_fr, key_es, key_de)
								//otherwise we can create a table
								// CREATE TABLE localized_text (
								// 	id INT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
								//  doc_id INT NOT NULL REFERENCES n2docs(id) ON UPDATE CASCADE ON DELETE CASCADE,
								// 	lang_code VARCHAR(3),
								// 	txt TEXT NOT NULL
								// );
								HashMap<String, String> colDef = new HashMap<String, String>();
								String k = att.getString("id");
								colDef.put("pgType", "TEXT");
								pgCols.put(k, colDef);
							} else if(aType.equalsIgnoreCase("date")) {
								logger.error("PG Sync does not support date field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("reference")) {
								logger.error("PG Sync does not support reference field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("array")) {
								logger.error("PG Sync does not support array field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("tag")) {
								logger.error("PG Sync does not support tag field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("selection")) {
								HashMap<String, String> colDef = new HashMap<String, String>();
								String k = att.getString("id");
								colDef.put("pgType", "TEXT");
								pgCols.put(k, colDef);
							} else if(aType.equalsIgnoreCase("checkbox")) {
								HashMap<String, String> colDef = new HashMap<String, String>();
								String k = att.getString("id");
								colDef.put("pgType", "BOOLEAN");
								pgCols.put(k, colDef);
							} else if(aType.equalsIgnoreCase("checkbox_group")) {
								JSONArray boxes = att.getJSONArray("checkboxes");
								for(Object box: boxes) {
									if(!(box instanceof JSONObject)) {
										logger.error("Expected JSONObject in checkboxes array, skipping");
										continue;
									}
									JSONObject jsonBox = (JSONObject)box;
									HashMap<String, String> colDef = new HashMap<String, String>();
									String k = jsonBox.getString("id");
									colDef.put("pgType", "BOOLEAN");
									pgCols.put(k, colDef);
								}
							} else if(aType.equalsIgnoreCase("file")) {
								logger.error("PG Sync does not support file field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("title")) {
								logger.error("PG Sync does not support title field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("geometry")) {
								HashMap<String, String> colDef = new HashMap<String, String>();
								String k = att.getString("id");
								colDef.put("pgType", "geometry");
								pgCols.put(k, colDef);
							} else if(aType.equalsIgnoreCase("hover_sound")) {
								logger.error("PG Sync does not support hover_sound field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("nunaliit_key_media_ref")) {
								logger.error("PG Sync does not support nunaliit_key_media_ref field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("triple")) {
								logger.error("PG Sync does not support triple field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("createdBy")) {
								logger.error("PG Sync does not support createdBy field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("createdTime")) {
								logger.error("PG Sync does not support createdTime field, found in schema: " + key);
								continue;
							} else if(aType.equalsIgnoreCase("custom")) {
								logger.error("PG Sync does not support custom field, found in schema: " + key);
								continue;
							}
						}
						String newTblName = "n2docs_" + key;
						jdbi.useHandle(handle -> {
							String createTable = "CREATE TABLE "+ newTblName + " (\n";
							List<String> fields = new ArrayList<String>();
							fields.add("doc_id INT PRIMARY KEY REFERENCES n2docs(id) ON UPDATE CASCADE ON DELETE CASCADE");
							
							for(String colName: pgCols.keySet()) {
								String pgType = pgCols.get(colName).get("pgType");
								fields.add(colName + " " + pgType);
							}
							createTable += String.join(", ", fields);
							createTable += ");";
						
							handle.execute("DROP TABLE IF EXISTS " + newTblName);
							handle.execute(createTable);
						});
					}
					schemas.put(key, pgCols);
				}
			}

			Map<String, Integer> layers = new HashMap<String, Integer>();
			// Loop over schemas and sync docs to postgres
			for (String schemaName : schemas.keySet()) {
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
								Integer pgId = h.select("INSERT INTO \"n2docs\" " +
								"(nunaliit_id, nunaliit_rev, nunaliit_schema, nunaliit_values, nunaliit_geom) values " +
								"(?, ?, ?, CAST(? AS jsonb), ST_GeomFromText(?)) returning id", 
								docId, doc.getRevision(), doc.getSchema(), doc.getJSONObject().toString(), geom)
									.mapTo(Integer.class)
									.one();

								for(String l: doc.getLayers()) {
									Integer layerId;
									if(layers.containsKey(l)) {
										layerId = layers.get(l);
									} else {//could check DB to see if it already exists;
										layerId = h.select("INSERT INTO n2layers (name) values (?) returning id", l).mapTo(Integer.class).one();
										layers.put(l, layerId);
									}
									h.execute("INSERT INTO n2docslayers (doc_id, layer_id) VALUES (?, ?)", pgId, layerId);
								}

								if(doc.getJSONObject().has(schemaName)) {
									Map<String, Map<String, String>> pgInfo = schemas.get(schemaName);
									String insStatment = "INSERT INTO n2docs_" + schemaName;
									List<String> fields = new ArrayList<String>();
									List<String> stmtVals = new ArrayList<String>();
									Map<String, Object> bindVals = new HashMap<String, Object>();
									JSONObject attributeJsonObject = doc.getJSONObject().getJSONObject(schemaName);
									for(String colName: pgInfo.keySet()) {
										if(attributeJsonObject.has(colName)) {
											fields.add(colName);
											stmtVals.add(":" + colName);
											Object val = attributeJsonObject.get(colName);
											if(pgInfo.get(colName).get("pgType").equals("TEXT") && !(val instanceof String)) {
												val = val.toString();
											}
											bindVals.put(colName, val);
										}
									}
									if(fields.size() > 0) {
										insStatment += " ( doc_id, " + String.join(", ", fields) + ") ";
										insStatment += " VALUES ( :doc_id, " + String.join(", ", stmtVals) + ") ";
										Update u = h.createUpdate(insStatment);
										u.bind("doc_id", pgId);
										for(String f: fields) {
											u.bind(f, bindVals.get(f));
										}
										u.execute();
									} else {
										logger.info("Nothing to insert for doc " + docId);
									}
								}
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
