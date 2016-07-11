package ca.carleton.gcrc.couch.export.records;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.List;

import org.json.JSONObject;
import org.json.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.export.ExportFormat;
import ca.carleton.gcrc.couch.export.ExportUtils.Filter;
import ca.carleton.gcrc.couch.utils.NunaliitDocument;
import ca.carleton.gcrc.couch.utils.NunaliitGeometry;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;
import ca.carleton.gcrc.geom.geojson.GeoJsonGeometryWriter;
import ca.carleton.gcrc.geom.wkt.WktParser;
import ca.carleton.gcrc.json.JSONSupport;

public class ExportRecordsGeoJson implements ExportFormat {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb couchDb;
	private JSONArrayReaderIterator recordReader;
	private Filter filter = Filter.ALL;
	
	public ExportRecordsGeoJson(CouchDb couchDb, JSONArrayReaderIterator recordReader){
		this.couchDb = couchDb;
		this.recordReader = recordReader;
	}
	
	public Filter getFilter() {
		return filter;
	}

	public void setFilter(Filter filter) {
		this.filter = filter;
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
		
		while( recordReader.hasNext() ){
			Object record = recordReader.next();
			if( null != record  ) {
				JSONObject jsonRecord = null;
				if( record instanceof JSONObject ){
					jsonRecord = (JSONObject)record;
				} else {
					throw new Exception("Record should be JSON object. Observed: "+record.getClass().getName());
				}

				try{
					outputRecord(jsonWriter, jsonRecord, geoWriter, wktParser);
				} catch(Exception e) {
					throw new Exception("Error exporting record", e);
				}
			}
		}
		
		jsonWriter.endArray(); // end feature collection
		jsonWriter.endObject(); // end wrapping object
	}

	private void outputRecord(JSONWriter jsonWriter, JSONObject jsonRecord, GeoJsonGeometryWriter geoWriter, WktParser wktParser) throws Exception {
		String id = null;
		try {
			id = jsonRecord.getString("_id");
		} catch (Exception e) {
			throw new Exception("In GeoJson export, records must have attribute '_id'",e);
		}
		
		try {
			// Attempt to get geometry
			Geometry geometry = null;
			String geomId = jsonRecord.optString("_geometry");
			if( null != geomId ){
				geometry = fetchGeometryFromDocId(geomId, wktParser);
			}

			// Output only if a geometry is available
			if( null != geometry ) {
				jsonWriter.object();
				
				jsonWriter.key("type");
				jsonWriter.value("Feature");
	
				jsonWriter.key("id");
				jsonWriter.value(id);
				
				jsonWriter.key("properties");
				jsonWriter.object();
	
				List<String> keys = JSONSupport.keysFromObject(jsonRecord);
				for(String key : keys){
					if( "_id".equals(key) ){
						// Ignore
					} else if( "_geometry".equals(key) ){
						// Ignore
					} else {
						Object value = jsonRecord.get(key);
						jsonWriter.key(key);
						jsonWriter.value(value);
					}
				}
						
				jsonWriter.endObject(); // end properties
	
				// Geometry
				jsonWriter.key("geometry");
				geoWriter.writeGeometry(jsonWriter, geometry);
						
				jsonWriter.endObject(); // end feature
			}

		} catch(Exception e) {
			throw new Exception("Error while exporting record "+id,e);
		}
	}

	private Geometry fetchGeometryFromDocId(String geomId, WktParser wktParser) throws Exception {
		try {
			Document doc = new DocumentCouchDb(couchDb, geomId);
			NunaliitDocument nunaliitDoc = new NunaliitDocument(doc);

			Geometry geometry = null;
			NunaliitGeometry docGeometry = nunaliitDoc.getOriginalGometry();
			if( null != docGeometry ) {
				String wkt = docGeometry.getWKT();
				if( null != wkt ){
					geometry = wktParser.parseWkt(wkt); 
				}
			}
			
			if( null != geometry ){
				geometry = filterGeometry(geometry);
			}

			return geometry;
		} catch (Exception e) {
			throw new Exception("Error while fetching original geometry for "+geomId,e);
		}
	}
	
	private Geometry filterGeometry(Geometry geometry){
		Geometry filteredGeometry = null;
		
		if( Filter.ALL == filter ){
			filteredGeometry = geometry;

		} else if( Filter.POINTS == filter ){
			if( geometry instanceof Point ){
				filteredGeometry = geometry;
			} else if( geometry instanceof MultiPoint ){
				filteredGeometry = geometry;
			} else if(  geometry instanceof GeometryCollection ){
				GeometryCollection collection = new GeometryCollection();
				accumulateFilteredGeometries(collection, (GeometryCollection)geometry);
				if( collection.size() > 0 ){
					geometry = collection;
				}
			}

		} else if( Filter.LINESTRINGS == filter ){
			if( geometry instanceof LineString ){
				filteredGeometry = geometry;
			} else if( geometry instanceof MultiLineString ){
				filteredGeometry = geometry;
			} else if(  geometry instanceof GeometryCollection ){
				GeometryCollection collection = new GeometryCollection();
				accumulateFilteredGeometries(collection, (GeometryCollection)geometry);
				if( collection.size() > 0 ){
					geometry = collection;
				}
			}

		} else if( Filter.POLYGONS == filter ){
			if( geometry instanceof Polygon ){
				filteredGeometry = geometry;
			} else if( geometry instanceof MultiPolygon ){
				filteredGeometry = geometry;
			} else if(  geometry instanceof GeometryCollection ){
				GeometryCollection collection = new GeometryCollection();
				accumulateFilteredGeometries(collection, (GeometryCollection)geometry);
				if( collection.size() > 0 ){
					geometry = collection;
				}
			}
		}
		
		return filteredGeometry;
	}

	private void accumulateFilteredGeometries(
			GeometryCollection out,
			GeometryCollection in
			) {
		for(Geometry geometry : in.getGeometries()){
			if( Filter.ALL == filter ){
				out.addGeometry(geometry);

			} else if( Filter.POINTS == filter ){
				if( geometry instanceof Point ){
					out.addGeometry(geometry);
				} else if( geometry instanceof MultiPoint ){
					out.addGeometry(geometry);
				} else if(  geometry instanceof GeometryCollection ){
					accumulateFilteredGeometries(out, (GeometryCollection)geometry);
				}

			} else if( Filter.LINESTRINGS == filter ){
				if( geometry instanceof LineString ){
					out.addGeometry(geometry);
				} else if( geometry instanceof MultiLineString ){
					out.addGeometry(geometry);
				} else if(  geometry instanceof GeometryCollection ){
					accumulateFilteredGeometries(out, (GeometryCollection)geometry);
				}

			} else if( Filter.POLYGONS == filter ){
				if( geometry instanceof Polygon ){
					out.addGeometry(geometry);
				} else if( geometry instanceof MultiPolygon ){
					out.addGeometry(geometry);
				} else if(  geometry instanceof GeometryCollection ){
					accumulateFilteredGeometries(out, (GeometryCollection)geometry);
				}
			}
		}
	}
}
