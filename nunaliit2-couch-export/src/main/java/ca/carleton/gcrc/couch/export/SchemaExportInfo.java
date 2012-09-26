package ca.carleton.gcrc.couch.export;

import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

public class SchemaExportInfo {
	
	static public SchemaExportInfo parseJson(JSONArray exportJson) throws Exception {
		SchemaExportInfo exportInfo = new SchemaExportInfo();
		
		for(int i=0,e=exportJson.length(); i<e; ++i){
			JSONObject jsonExportProperty = exportJson.getJSONObject(i);
			SchemaExportProperty exportProperty = SchemaExportProperty.parseJson(jsonExportProperty);
			exportInfo.addProperty(exportProperty);
		}
		
		return exportInfo;
	}

	private List<SchemaExportProperty> properties = new Vector<SchemaExportProperty>();

	public List<SchemaExportProperty> getProperties() {
		return properties;
	}

	public void addProperty(SchemaExportProperty property){
		properties.add(property);
	}
}
