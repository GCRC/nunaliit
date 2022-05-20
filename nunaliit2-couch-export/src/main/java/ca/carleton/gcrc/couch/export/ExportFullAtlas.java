package ca.carleton.gcrc.couch.export;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalSchema;
import ca.carleton.gcrc.couch.export.impl.ExportFormatGeoJson;
import ca.carleton.gcrc.couch.export.impl.SchemaCacheCouchDb;

public class ExportFullAtlas {
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	private CouchDesignDocument dd;
	private String atlasRootPath;
	private CouchDb couchDb;

	public ExportFullAtlas(String realRootPath, CouchDb couchDb) throws Exception {
		this.couchDb = couchDb;
		dd = couchDb.getDesignDocument("atlas");
		atlasRootPath = realRootPath;
	}
	
	public void createExport() {
		File exportDir = null;
		{
			Calendar calendar = Calendar.getInstance();
			String name = String.format(
				"export_%04d-%02d-%02d_%02d:%02d:%02d"
				,calendar.get(Calendar.YEAR)
				,(calendar.get(Calendar.MONTH)+1)
				,calendar.get(Calendar.DAY_OF_MONTH)
				,calendar.get(Calendar.HOUR_OF_DAY)
				,calendar.get(Calendar.MINUTE)
				,calendar.get(Calendar.SECOND)
				);
			exportDir = new File(atlasRootPath, "dump/"+name);
			exportDir.mkdirs();
		}
		logger.debug("Writing export " + exportDir.getAbsolutePath());

		//Find schemas that need to be exported
		CouchQuery query = new CouchQuery();
		query.setViewName("schemas");
		CouchQueryResults results;
		try {
			query.setIncludeDocs(false);
			results = dd.performQuery(query);
		} catch (Exception e) {
			logger.error("Error querying DB for schemas", e);
			return;
		}
		
		Set<String> schemas = new HashSet<String>();
		for(JSONObject row : results.getRows()){
			String docId = row.optString("id");
			String key = row.optString("key");
			if( null != docId && !docId.startsWith("org.nunaliit")) {
				schemas.add(key);
			}
		}

		logger.debug("Fetching data for schemas: ", schemas);

		//Loop over schemas and export docs to GeoJSON
		try {
			for(String schemaName: schemas) {
				// CouchQuery queryBySchema = new CouchQuery();
				// queryBySchema.setViewName("nunaliit-schema");
				// queryBySchema.setStartKey(schemaName);
				// queryBySchema.setEndKey(schemaName);
				// queryBySchema.setIncludeDocs(false);
				
				// CouchQueryResults resultBySchema = dd.performQuery(queryBySchema);
				
				// Set<String> ids = new HashSet<String>();
				// for(JSONObject row : resultBySchema.getRows()){
				// 	String docId = row.optString("id");
				// 	if( null != docId ) {
				// 		ids.add(docId);
				// 	}
				// }

				// Build doc retrieval based on method
				DocumentRetrieval docRetrieval = null;
				docRetrieval = DocumentRetrievalSchema.create(couchDb, schemaName);

				ExportFormat outputFormat;
				SchemaCache schemaCache = new SchemaCacheCouchDb(couchDb);
				outputFormat = new ExportFormatGeoJson(schemaCache, docRetrieval);

				File outputFile = new File(exportDir, schemaName + ".geojson");
				outputFile.createNewFile();
				FileOutputStream fos  = new FileOutputStream(outputFile);
				outputFormat.outputExport(fos);
				fos.close();
				
				//now fetch each doc and write to GeoJSON array. Should stream to disk probably
				
			}
		} catch (Exception e) {
			logger.error("Error fetching schema docs and writing results", e);
			return;
		}
		

		//Export all original media files to export dir

		//tar.gz the export folder

	}
}
