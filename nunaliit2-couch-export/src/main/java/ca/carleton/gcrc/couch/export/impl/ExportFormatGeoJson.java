package ca.carleton.gcrc.couch.export.impl;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;

import org.json.JSONObject;
import org.json.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;
import ca.carleton.gcrc.couch.export.ExportFormat;
import ca.carleton.gcrc.couch.export.SchemaCache;
import ca.carleton.gcrc.couch.export.SchemaExportInfo;
import ca.carleton.gcrc.couch.export.SchemaExportProperty;
import ca.carleton.gcrc.couch.utils.NunaliitDocument;
import ca.carleton.gcrc.couch.utils.NunaliitGeometry;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.geojson.GeoJsonGeometryWriter;
import ca.carleton.gcrc.geom.wkt.WktParser;

public class ExportFormatGeoJson implements ExportFormat {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private DocumentRetrieval retrieval = null;
	private SchemaCache schemaCache = null;
	
	public ExportFormatGeoJson(
		SchemaCache schemaCache
		,DocumentRetrieval retrieval
		) throws Exception {
		this.schemaCache = schemaCache;
		this.retrieval = retrieval;
	}
	
	@Override
	public String getMimeType() {
		return "application/json";
	}

	@Override
	public String getCharacterEncoding() {
		return "utf-8";
	}

	@Override
	public void outputExport(OutputStream os) throws Exception {
		OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
		outputExport(osw);
		osw.flush();
	}

	public void outputExport(Writer writer) throws Exception {
		JSONWriter jsonWriter = new JSONWriter(writer);
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		WktParser wktParser = new WktParser();
	
		jsonWriter.object();
		
		jsonWriter.key("type");
		jsonWriter.value("FeatureCollection");

		jsonWriter.key("features");
		jsonWriter.array();
		
		while( retrieval.hasNext() ){
			Document doc = retrieval.getNext();
			if( null != doc  ) {
				try{
					outputDocument(jsonWriter, doc, geoWriter, wktParser);
				} catch(Exception e) {
					throw new Exception("Error exporting document: "+doc.getId(), e);
				}
			}
		}
		
		jsonWriter.endArray(); // end feature collection
		jsonWriter.endObject(); // end wrapping object
	}

	private void outputDocument(JSONWriter jsonWriter, Document doc, GeoJsonGeometryWriter geoWriter, WktParser wktParser) throws Exception {
		NunaliitDocument nunaliitDoc = new NunaliitDocument(doc);

		JSONObject jsonDoc = nunaliitDoc.getJSONObject();
		
		String schemaName = jsonDoc.optString("nunaliit_schema", null);
		if( null != schemaName ) {
			NunaliitGeometry docGeometry = nunaliitDoc.getOriginalGometry();
			SchemaExportInfo exportInfo = schemaCache.getExportInfo(schemaName);
			
			if( null != exportInfo || null != docGeometry ){
				jsonWriter.object();
				
				jsonWriter.key("type");
				jsonWriter.value("Feature");
	
				jsonWriter.key("id");
				jsonWriter.value(nunaliitDoc.getId());
				
				jsonWriter.key("properties");
				jsonWriter.object();
				
				String rev = jsonDoc.optString("_rev", null);
				if( null != rev ){
					jsonWriter.key("_rev");
					jsonWriter.value(rev);
				}
				
				if( null != exportInfo ){
					for(SchemaExportProperty exportProperty : exportInfo.getProperties()){
						Object value = exportProperty.select(jsonDoc);
						if( null != value ) {
							jsonWriter.key(exportProperty.getLabel());
							jsonWriter.value(value);
						}
					}
				}
				
				jsonWriter.endObject(); // end properties
				
				if( null != docGeometry ) {
					String wkt = docGeometry.getWKT();
					if( null != wkt ){
						Geometry geometry = wktParser.parseWkt(wkt); 
						jsonWriter.key("geometry");
						geoWriter.writeGeometry(jsonWriter, geometry);
					}
				}
				
				jsonWriter.endObject(); // end feature
			}
		}
	}
}
