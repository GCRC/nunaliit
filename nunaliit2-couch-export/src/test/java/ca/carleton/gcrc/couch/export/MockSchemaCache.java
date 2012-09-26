package ca.carleton.gcrc.couch.export;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;

public class MockSchemaCache implements SchemaCache {

	private Map<String,Document> documentsFromSchemaName = new HashMap<String,Document>();
	private Map<String,SchemaExportInfo> exportInfoFromSchemaName = new HashMap<String,SchemaExportInfo>();
	
	@Override
	public Document getSchema(String schemaName) throws Exception {
		return documentsFromSchemaName.get(schemaName);
	}

	@Override
	public SchemaExportInfo getExportInfo(String schemaName) throws Exception {
		if( exportInfoFromSchemaName.containsKey(schemaName) ){
			return exportInfoFromSchemaName.get(schemaName);
		}
		
		SchemaExportInfo exportInfo = null;
		try {
			Document doc = getSchema(schemaName);
			JSONArray jsonExport = doc.getJSONObject().optJSONArray("export");
			if( null != jsonExport ) {
				exportInfo = SchemaExportInfo.parseJson(jsonExport);
			}
		} catch(Exception e) {
			throw new Exception("Error parsing export field for schema: "+schemaName);
		}
		
		exportInfoFromSchemaName.put(schemaName,exportInfo);
		
		return exportInfo;
	}

	public void addDocument(Document doc){
		JSONObject jsonDoc = doc.getJSONObject();
		String type = jsonDoc.optString("nunaliit_type");
		if( "schema".equals(type) ){
			String schemaName = jsonDoc.optString("name");
			if( null != schemaName ) {
				documentsFromSchemaName.put(schemaName, doc);
			}
		}
	}
}
