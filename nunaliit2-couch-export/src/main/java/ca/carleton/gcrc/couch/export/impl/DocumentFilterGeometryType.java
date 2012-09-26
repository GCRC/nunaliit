package ca.carleton.gcrc.couch.export.impl;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.export.DocumentFilter;
import ca.carleton.gcrc.couch.export.ExportUtils.Filter;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;
import ca.carleton.gcrc.geom.wkt.WktParser;
import ca.carleton.gcrc.json.JSONSupport;

public class DocumentFilterGeometryType implements DocumentFilter {

	static private WktParser wktParser = new WktParser();
	
	private Filter filterType;
	
	public DocumentFilterGeometryType(Filter filterType){
		this.filterType = filterType;
	}
	
	@Override
	public boolean accepts(Document doc) throws Exception {
		if( filterType == Filter.ALL ) {
			return true;
		}
		
		Geometry geometry = null; 
		try {
			JSONObject jsonDoc = doc.getJSONObject();
			if( JSONSupport.containsKey(jsonDoc, "nunaliit_geom") ) {
				JSONObject jsonGeom = jsonDoc.getJSONObject("nunaliit_geom");
				String wkt = jsonGeom.optString("wkt", null);
				if( null != wkt ){
					geometry = wktParser.parseWkt(wkt); 
				}
			}
			
		} catch(Exception e) {
			throw new Exception("Error while filtering on geometry", e);
		}
		
		return acceptsGeometry(geometry);
	}

	private boolean acceptsGeometry(Geometry geometry){
		if( geometry instanceof Point
		 && filterType == Filter.POINTS ) {
			return true;
			
		} else if( geometry instanceof MultiPoint
		 && filterType == Filter.POINTS ) {
			return true;
			
		} else if( geometry instanceof LineString
		 && filterType == Filter.LINESTRINGS ) {
			return true;
			
		} else if( geometry instanceof MultiLineString
		 && filterType == Filter.LINESTRINGS ) {
			return true;
			
		} else if( geometry instanceof Polygon
		 && filterType == Filter.POLYGONS ) {
			return true;
			
		} else if( geometry instanceof MultiPolygon
		 && filterType == Filter.POLYGONS ) {
			return true;
			
		} else if( geometry instanceof GeometryCollection ) {
			GeometryCollection collection = (GeometryCollection)geometry;
			for(Geometry g : collection.getGeometries()){
				if( false == acceptsGeometry(g) ) {
					return false;
				}
			}
			return true;
		}
		
		return false;
	}
}
