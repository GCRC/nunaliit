package ca.carleton.gcrc.couch.export;

import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentJSON;

public class TestSupport {

	static public DocumentRetrieval getTestRetrieval() throws Exception {
		List<Document> docs = new Vector<Document>();
		
		{
			JSONObject jsonDoc = new JSONObject();
			jsonDoc.put("_id", "doc1");
			jsonDoc.put("nunaliit_schema", "test_schema");
			
			{
				JSONObject test = new JSONObject();
				test.put("name", "my name");
				jsonDoc.put("test", test);
			}
			
			{
				JSONObject geom = new JSONObject();
				geom.put("type", "geometry");
				geom.put("wkt", "POINT(0 0)");
				
				JSONArray bbox = new JSONArray();
				bbox.put(0);
				bbox.put(0);
				bbox.put(0);
				bbox.put(0);
				geom.put("bbox", bbox);
				
				jsonDoc.put("nunaliit_geom", geom);
			}
			
			Document doc = new DocumentJSON(jsonDoc);
			docs.add(doc);
		}
		
		return new MockRetrieval(docs);
	}

	static public SchemaCache getTestSchemaCache() throws Exception {
		MockSchemaCache schemaCache = new MockSchemaCache();
		
		{
			JSONObject jsonDoc = new JSONObject();
			jsonDoc.put("_id", "schema:test_schema");
			jsonDoc.put("nunaliit_type", "schema");
			jsonDoc.put("name", "test_schema");
			
			JSONArray export = new JSONArray();
			
			{
				JSONObject prop = new JSONObject();
				prop.put("label", "name");
				prop.put("select", "test.name");
				export.put(prop);
			}
			
			jsonDoc.put("export", export);
			
			Document doc = new DocumentJSON(jsonDoc);
			schemaCache.addDocument(doc);
		}
		
		return schemaCache;
	}
}
