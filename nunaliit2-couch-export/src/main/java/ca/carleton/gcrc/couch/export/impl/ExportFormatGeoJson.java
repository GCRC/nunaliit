package ca.carleton.gcrc.couch.export.impl;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;

import org.apache.log4j.Logger;
import org.json.JSONObject;
import org.json.JSONWriter;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.export.DocumentFilter;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;
import ca.carleton.gcrc.couch.export.ExportFormat;
import ca.carleton.gcrc.couch.export.SchemaCache;
import ca.carleton.gcrc.couch.export.SchemaExportInfo;
import ca.carleton.gcrc.couch.export.SchemaExportProperty;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.geojson.GeoJsonGeometryWriter;
import ca.carleton.gcrc.geom.wkt.WktParser;
import ca.carleton.gcrc.json.JSONSupport;

public class ExportFormatGeoJson implements ExportFormat {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private DocumentRetrieval retrieval = null;
	private SchemaCache schemaCache = null;
	private DocumentFilter docFilter = null;
	
	public ExportFormatGeoJson(
		SchemaCache schemaCache
		,DocumentRetrieval retrieval
		,DocumentFilter docFilter
		) throws Exception {
		this.schemaCache = schemaCache;
		this.retrieval = retrieval;
		this.docFilter = docFilter;
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
			if( null != doc 
			 && docFilter.accepts(doc) ) {
				JSONObject jsonDoc = doc.getJSONObject();
				
				String schemaName = jsonDoc.optString("nunaliit_schema");
				if( null != schemaName ) {
					boolean containsGeometry = JSONSupport.containsKey(jsonDoc, "nunaliit_geom");
					SchemaExportInfo exportInfo = schemaCache.getExportInfo(schemaName);
					
					if( null != exportInfo || containsGeometry ){
						jsonWriter.object();
						
						jsonWriter.key("type");
						jsonWriter.value("Feature");

						jsonWriter.key("id");
						jsonWriter.value(doc.getId());
						
						jsonWriter.key("properties");
						jsonWriter.object();
						
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
						
						if( containsGeometry ) {
							JSONObject jsonGeom = jsonDoc.getJSONObject("nunaliit_geom");
							String wkt = jsonGeom.optString("wkt", null);
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
		
		jsonWriter.endArray(); // end feature collection
		jsonWriter.endObject(); // end wrapping object
	}
}
