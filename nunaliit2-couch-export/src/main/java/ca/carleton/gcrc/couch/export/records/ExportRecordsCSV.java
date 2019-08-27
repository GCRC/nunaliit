package ca.carleton.gcrc.couch.export.records;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.export.ExportFormat;
import ca.carleton.gcrc.couch.export.ExportUtils.Filter;
import ca.carleton.gcrc.couch.export.csv.CSV;
import ca.carleton.gcrc.couch.export.csv.CSVColumn;
import ca.carleton.gcrc.couch.export.csv.CSVSettings;
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
import ca.carleton.gcrc.geom.wkt.WktParser;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class ExportRecordsCSV implements ExportFormat {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb couchDb;
	private JSONArrayReaderIterator recordReader;
	private Filter filter = Filter.ALL;
	
	public ExportRecordsCSV(CouchDb couchDb, JSONArrayReaderIterator recordReader){
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
		return "text/csv";
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
		WktParser wktParser = new WktParser();
		WktWriter wktWriter = new WktWriter();
		
		CSVSettings csvSettings;
		try {
			JSONObject headRecord = readRecord();
			csvSettings = parseCsvSettings(headRecord);
		} catch (Exception e) {
			throw new Exception("Error while interpreting CSV header record", e);
		}
		
		// Output first line
		outputHeader(writer, csvSettings);

		// Read and ouput records
		JSONObject record = readRecord();
		while( null != record ){
			try{
				outputRecord(writer, record, csvSettings, wktWriter, wktParser);
			} catch(Exception e) {
				throw new Exception("Error exporting record", e);
			}
			
			record = readRecord();
		}
	}
	
	private JSONObject readRecord() throws Exception {
		JSONObject jsonRecord = null;
		
		if( recordReader.hasNext() ){
			Object record = recordReader.next();
			if( null != record  ) {
				if( record instanceof JSONObject ){
					jsonRecord = (JSONObject)record;
				} else {
					throw new Exception("Record should be JSON object. Observed: "+record.getClass().getName());
				}
			}
		}
		
		return jsonRecord;
	}
	
	private CSVSettings parseCsvSettings(JSONObject headRecord) throws Exception {
		JSONObject csv = headRecord.getJSONObject("_csv");
		
		CSVSettings csvSettings = new CSVSettings();
		
		JSONArray columnArr = csv.getJSONArray("columns");
		for(int i=0,e=columnArr.length(); i<e; ++i){
			Object columnObj = columnArr.get(i);
			if( columnObj instanceof JSONObject ){
				JSONObject jsonColumnDef = (JSONObject)columnObj;
				String name = jsonColumnDef.optString("name",null);
				String label = jsonColumnDef.optString("label",null);
				
				if( null == name ){
					throw new Exception("Column definition must have a name");
				}
				if( null == label ){
					label = name;
				}
				
				CSVColumn csvColumn = new CSVColumn();
				csvColumn.setName(name);
				csvColumn.setLabel(label);
				
				csvSettings.addColumn(csvColumn);
				
			} else {
				throw new Exception("_csv.columns must be array of column definitions (objects)");
			}
		}
		
		return csvSettings;
	}

	private void outputHeader(
			Writer jsonWriter, 
			CSVSettings csvSettings) throws Exception {

		List<CSVColumn> columns = csvSettings.getColumns();

		List<Object> values = new Vector<Object>();
		for(CSVColumn column : columns){
			values.add(column.getLabel());
		}
		
		CSV.printCsvLine(jsonWriter, values);
	}
	
	private void outputRecord(
			Writer jsonWriter, 
			JSONObject jsonRecord, 
			CSVSettings csvSettings,
			WktWriter wktWriter,
			WktParser wktParser) throws Exception {

		String id = null;
		try {
			id = jsonRecord.getString("_id");
		} catch (Exception e) {
			// Ignore. Not needed in CSV
		}

		try {
			// Attempt to get geometry
			Geometry geometry = null;
			{
				String geomId = jsonRecord.optString("_geometry",null);
				String wkt = jsonRecord.optString("_wkt",null);
				if( null != geomId ){
					geometry = fetchGeometryFromDocId(geomId, wktParser);
				} else if( null != wkt ){
					geometry = wktParser.parseWkt(wkt);
				}
				if( null != geometry ){
					geometry = filterGeometry(geometry);
				}
			}

			List<CSVColumn> columns = csvSettings.getColumns();

			List<Object> values = new Vector<Object>();
			for(CSVColumn column : columns){
				String columnName = column.getName();
				
				Object value = null;
				if( "_geometry".equals(columnName) ){
					if( null != geometry ){
						value = wktWriter.toWkt(geometry);
					}
				} else {
					value = jsonRecord.opt(columnName);
				}
				
				values.add(value);
			}
			
			CSV.printCsvLine(jsonWriter, values);

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
