package ca.carleton.gcrc.couch.export;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.export.impl.ExportFormatGeoJson;
import junit.framework.TestCase;

public class ExportFormatGeoJsonTest extends TestCase {

	public void testOutputWriter() throws Exception {
		DocumentRetrieval docRetrieval = TestSupport.getTestRetrieval();
		SchemaCache schemaCache = TestSupport.getTestSchemaCache();
		
		ExportFormatGeoJson format = new ExportFormatGeoJson(schemaCache, docRetrieval, new MockDocumentFilter());
		
		StringWriter sw = new StringWriter();
		format.outputExport(sw);
		
		JSONTokener tokener = new JSONTokener(sw.toString());
		//JSONObject obj = 
				new JSONObject(tokener);
	}

	public void testOutputStream() throws Exception {
		DocumentRetrieval docRetrieval = TestSupport.getTestRetrieval();
		SchemaCache schemaCache = TestSupport.getTestSchemaCache();
		
		ExportFormatGeoJson format = new ExportFormatGeoJson(schemaCache, docRetrieval, new MockDocumentFilter());
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		format.outputExport(baos);
		
		ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
		InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
		
		JSONTokener tokener = new JSONTokener(isr);
		//JSONObject obj = 
				new JSONObject(tokener);
	}
}
