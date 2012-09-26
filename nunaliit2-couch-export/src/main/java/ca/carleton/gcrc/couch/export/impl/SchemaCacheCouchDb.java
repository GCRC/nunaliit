package ca.carleton.gcrc.couch.export.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentJSON;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.export.SchemaCache;
import ca.carleton.gcrc.couch.export.SchemaExportInfo;

public class SchemaCacheCouchDb implements SchemaCache {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
//	private CouchDb couchDb;
	private CouchDesignDocument dd;
	private Map<String,Document> documentsFromSchemaName = new HashMap<String,Document>();
	private Map<String,SchemaExportInfo> exportInfoFromSchemaName = new HashMap<String,SchemaExportInfo>();
	
	public SchemaCacheCouchDb(CouchDb couchDb) throws Exception {
//		this.couchDb = couchDb;
		
		this.dd = couchDb.getDesignDocument("atlas");
	}
	
	@Override
	public Document getSchema(String schemaName) throws Exception {
		if( documentsFromSchemaName.containsKey(schemaName) ) {
			return documentsFromSchemaName.get(schemaName);
		}
		
		CouchQuery query = new CouchQuery();
		query.setViewName("schemas");
		query.setStartKey(schemaName);
		query.setEndKey(schemaName);
		query.setIncludeDocs(true);
		
		CouchQueryResults results = dd.performQuery(query);
		
		List<JSONObject> rows = results.getRows();
		if( rows.size() < 1 ) {
			documentsFromSchemaName.put(schemaName, null);
			return null;
		}
		
		JSONObject row = rows.get(0);
		JSONObject jsonDoc = row.optJSONObject("doc");
		if( null == jsonDoc ) {
			documentsFromSchemaName.put(schemaName, null);
			return null;
		}

		Document doc = new DocumentJSON(jsonDoc);
		documentsFromSchemaName.put(schemaName, doc);
		
		return doc;
	}

	@Override
	public SchemaExportInfo getExportInfo(String schemaName) throws Exception {
		if( exportInfoFromSchemaName.containsKey(schemaName) ){
			return exportInfoFromSchemaName.get(schemaName);
		}
		
		SchemaExportInfo exportInfo = null;
		try {
			Document doc = getSchema(schemaName);
			if( null != doc ) {
				JSONArray jsonExport = doc.getJSONObject().optJSONArray("export");
				if( null != jsonExport ) {
					exportInfo = SchemaExportInfo.parseJson(jsonExport);
				}
			}
		} catch(Exception e) {
			throw new Exception("Error parsing export field for schema: "+schemaName);
		}
		
		exportInfoFromSchemaName.put(schemaName,exportInfo);
		
		return exportInfo;
	}
}
