package ca.carleton.gcrc.geom.geojson;

import java.io.Reader;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;

public class GeoJsonParser {

	public List<GeoJsonFeature> parse(Reader reader) throws Exception {
		try {
			JSONTokener tokener = new JSONTokener(reader);
			Object obj = tokener.nextValue();
			if( obj instanceof JSONObject ) {
				JSONObject featureCollection = (JSONObject)obj;
				
				return parseFeatureCollection(featureCollection);
				
			} else {
				throw new Exception("Expected a JSON object at top level");
			}
		} catch(Exception e) {
			throw new Exception("Error while parsing the JSON",e);
		}
	}
	
	private List<GeoJsonFeature> parseFeatureCollection(JSONObject featureCollection) throws Exception {
		try {
			// Verify "type"
			String type = featureCollection.optString("type");
			if( null == type ){
				throw new Exception("Key 'type' expected for a FeatureCollection");
			}
			if( false == "FeatureCollection".equals(type) ){
				throw new Exception("FeatureCollection with unexpected type: "+type);
			}
			
			// Check array "features"
			JSONArray featuresArray = featureCollection.getJSONArray("features");
			if( null == featuresArray ) {
				throw new Exception("FeatureCollections should contain an array called 'features'");
			}
			
			List<GeoJsonFeature> features = new Vector<GeoJsonFeature>();
			for(int loop=0,e=featuresArray.length(); loop<e; ++loop){
				Object obj = featuresArray.get(loop);
				if( obj instanceof JSONObject ){
					JSONObject featureObj = (JSONObject)obj;
					GeoJsonFeature feature = parseFeature(featureObj);
					features.add(feature);
					
				} else {
					throw new Exception("A feature should be an object");
				}
			}
			return features;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing FeatureCollection",e);
		}
	}
	
	private GeoJsonFeature parseFeature(JSONObject featureObj) throws Exception {
		try {
			// Verify "type"
			String type = featureObj.optString("type");
			if( null == type ){
				throw new Exception("Key 'type' expected for a Feature");
			}
			if( false == "Feature".equals(type) ){
				throw new Exception("Feature with unexpected type: "+type);
			}
			
			GeoJsonFeature geoJsonFeature = new GeoJsonFeature();
			
			// Check for identifier
			String id = featureObj.optString("id");
			if( null != id ) {
				geoJsonFeature.setId(id);
			}
			
			// Check object "geometry"
			JSONObject geometryObj = featureObj.getJSONObject("geometry");
			if( null == geometryObj ) {
				throw new Exception("Features should contain an object called 'geometry'");
			}
			Geometry geom = null;
			try {
				geom = parseGeometry(geometryObj);
			} catch(Exception e) {
				throw new Exception("Error while parsing feature geometry", e);
			}
			geoJsonFeature.setGeometry(geom);
			
			// Check for properties
			JSONObject propertiesObj = featureObj.optJSONObject("properties");
			if( null != propertiesObj ) {
				geoJsonFeature.setProperties(propertiesObj);
			}
			
			return geoJsonFeature;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing Feature",e);
		}
	}

	public Geometry parseGeometry(JSONObject geometryObj) throws Exception {
		try {
			// Verify "type"
			String type = geometryObj.optString("type");
			if( null == type ){
				throw new Exception("Key 'type' expected for a geometry");
			}
			
			if( "Point".equals(type) ) {
				return parsePoint(geometryObj);

			} else if( "LineString".equals(type) ) {
				return parseLineString(geometryObj);
			
			} else if( "Polygon".equals(type) ) {
				return parsePolygon(geometryObj);
			
			} else if( "MultiPoint".equals(type) ) {
				return parseMultiPoint(geometryObj);
			
			} else if( "MultiLineString".equals(type) ) {
				return parseMultiLineString(geometryObj);
			
			} else if( "MultiPolygon".equals(type) ) {
				return parseMultiPolygon(geometryObj);
			
			} else if( "GeometryCollection".equals(type) ) {
				return parseGeometryCollection(geometryObj);
			
			} else {
				throw new Exception("Unexpected type for geometry: "+type);
			}
			
		} catch(Exception e) {
			throw new Exception("Error while parsing geometry",e);
		}
	}

	private Point parsePoint(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray coordinates = geometryObj.getJSONArray("coordinates");
			if( null == coordinates ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			Point point = new Point();
			
			for(int i=0,e=coordinates.length(); i<e; ++i){
				double position = coordinates.getDouble(i);
				point.addPosition(position);
			}
			
			return point;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing point",e);
		}
	}

	private LineString parseLineString(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray points = geometryObj.getJSONArray("coordinates");
			if( null == points ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			LineString lineString = new LineString();
			
			for(int pointIndex=0,pointEnd=points.length(); pointIndex<pointEnd; ++pointIndex){
				JSONArray coordinates = points.getJSONArray(pointIndex);
				Point point = new Point();
				for(int coordIndex=0,coordEnd=coordinates.length(); coordIndex<coordEnd; ++coordIndex){
					double position = coordinates.getDouble(coordIndex);
					point.addPosition(position);
				}
				lineString.addPoint(point);
			}
			
			return lineString;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing linestring",e);
		}
	}

	private Polygon parsePolygon(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray lineStrings = geometryObj.getJSONArray("coordinates");
			if( null == lineStrings ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			Polygon polygon = new Polygon();
			
			for(int lsIndex=0,lsEnd=lineStrings.length(); lsIndex<lsEnd; ++lsIndex){
				JSONArray points = lineStrings.getJSONArray(lsIndex);
				LineString lineString = new LineString();
			
				for(int pointIndex=0,pointEnd=points.length(); pointIndex<pointEnd; ++pointIndex){
					JSONArray coordinates = points.getJSONArray(pointIndex);
					Point point = new Point();
					for(int coordIndex=0,coordEnd=coordinates.length(); coordIndex<coordEnd; ++coordIndex){
						double position = coordinates.getDouble(coordIndex);
						point.addPosition(position);
					}
					lineString.addPoint(point);
				}
				
				polygon.addLinearRing(lineString);
			}
			
			return polygon;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing polygon",e);
		}
	}

	private MultiPoint parseMultiPoint(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray points = geometryObj.getJSONArray("coordinates");
			if( null == points ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			MultiPoint multiPoint = new MultiPoint();
			
			for(int pointIndex=0,pointEnd=points.length(); pointIndex<pointEnd; ++pointIndex){
				JSONArray coordinates = points.getJSONArray(pointIndex);
				Point point = new Point();
				for(int coordIndex=0,coordEnd=coordinates.length(); coordIndex<coordEnd; ++coordIndex){
					double position = coordinates.getDouble(coordIndex);
					point.addPosition(position);
				}
				multiPoint.addPoint(point);
			}
			
			return multiPoint;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing multi point",e);
		}
	}

	private MultiLineString parseMultiLineString(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray lineStrings = geometryObj.getJSONArray("coordinates");
			if( null == lineStrings ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			MultiLineString multiLineString = new MultiLineString();
			
			for(int lsIndex=0,lsEnd=lineStrings.length(); lsIndex<lsEnd; ++lsIndex){
				JSONArray points = lineStrings.getJSONArray(lsIndex);
				LineString lineString = new LineString();
			
				for(int pointIndex=0,pointEnd=points.length(); pointIndex<pointEnd; ++pointIndex){
					JSONArray coordinates = points.getJSONArray(pointIndex);
					Point point = new Point();
					for(int coordIndex=0,coordEnd=coordinates.length(); coordIndex<coordEnd; ++coordIndex){
						double position = coordinates.getDouble(coordIndex);
						point.addPosition(position);
					}
					lineString.addPoint(point);
				}
				
				multiLineString.addLineString(lineString);
			}
			
			return multiLineString;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing multi linestring",e);
		}
	}

	private MultiPolygon parseMultiPolygon(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray polygons = geometryObj.getJSONArray("coordinates");
			if( null == polygons ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			MultiPolygon multiPolygon = new MultiPolygon();
			
			for(int polyIndex=0,polyEnd=polygons.length(); polyIndex<polyEnd; ++polyIndex){
				JSONArray lineStrings = polygons.getJSONArray(polyIndex);
				Polygon polygon = new Polygon();
				
				for(int lsIndex=0,lsEnd=lineStrings.length(); lsIndex<lsEnd; ++lsIndex){
					JSONArray points = lineStrings.getJSONArray(lsIndex);
					LineString lineString = new LineString();
				
					for(int pointIndex=0,pointEnd=points.length(); pointIndex<pointEnd; ++pointIndex){
						JSONArray coordinates = points.getJSONArray(pointIndex);
						Point point = new Point();
						for(int coordIndex=0,coordEnd=coordinates.length(); coordIndex<coordEnd; ++coordIndex){
							double position = coordinates.getDouble(coordIndex);
							point.addPosition(position);
						}
						lineString.addPoint(point);
					}
					
					polygon.addLinearRing(lineString);
				}
				
				multiPolygon.addPolygon(polygon);
			}
			
			return multiPolygon;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing multi polygon",e);
		}
	}

	private GeometryCollection parseGeometryCollection(JSONObject geometryObj) throws Exception {
		try {
			// Get coordinates
			JSONArray geometries = geometryObj.getJSONArray("geometries");
			if( null == geometries ) {
				throw new Exception("A geometry must contain an array called 'coordinates'");
			}
			
			GeometryCollection geometryCollection = new GeometryCollection();
			
			for(int i=0,e=geometries.length(); i<e; ++i){
				JSONObject gObj = geometries.getJSONObject(i);
				Geometry g = parseGeometry(gObj);
				geometryCollection.addGeometry(g);
			}
			
			return geometryCollection;
			
		} catch(Exception e) {
			throw new Exception("Error while parsing geometry collection",e);
		}
	}
}
