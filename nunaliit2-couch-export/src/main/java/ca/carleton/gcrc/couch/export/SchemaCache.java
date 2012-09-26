package ca.carleton.gcrc.couch.export;

import ca.carleton.gcrc.couch.app.Document;

public interface SchemaCache {

	Document getSchema(String schemaName) throws Exception;
	
	SchemaExportInfo getExportInfo(String schemaName) throws Exception;
}
