package ca.carleton.gcrc.geom;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.util.List;

import ca.carleton.gcrc.geom.geojson.GeoJsonFeature;
import ca.carleton.gcrc.geom.geojson.GeoJsonParser;

import junit.framework.TestCase;

public class GeoJsonParserTest extends TestCase {

	static private Geometry getGeometryFromGeoJson(String geoJson) throws Exception {
		StringReader sr = new StringReader(geoJson);
		GeoJsonParser geoJsonParser = new GeoJsonParser();
		List<GeoJsonFeature> features = geoJsonParser.parse(sr);
		return features.get(0).getGeometry();
	}
	
	public void testPoint() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[0,1]}}]}");
		if( false == (geom instanceof Point) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testMultiPoint() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"MultiPoint\",\"coordinates\":[[0,1],[2,3]]}}]}");
		if( false == (geom instanceof MultiPoint) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testLineString() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[0,1],[2,3]]}}]}");
		if( false == (geom instanceof LineString) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testMultiLineString() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"MultiLineString\",\"coordinates\":[[[0,1],[2,3]],[[4,5],[6,7]]]}}]}");
		if( false == (geom instanceof MultiLineString) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testPolygon() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,1],[2,3],[4,5]]]}}]}");
		if( false == (geom instanceof Polygon) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testMultiPolygon() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"MultiPolygon\",\"coordinates\":[[[[0,1],[2,3],[4,5]]]]}}]}");
		if( false == (geom instanceof MultiPolygon) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testGeometryCollection() throws Exception {
		Geometry geom = getGeometryFromGeoJson("{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"GeometryCollection\",\"geometries\":[{\"type\":\"Point\",\"coordinates\":[0,1]},{\"type\":\"Point\",\"coordinates\":[2,3]}]}}]}");
		if( false == (geom instanceof GeometryCollection) ){
			throw new Exception("Unexpected type: "+geom.getClass().getName());
		}
	}
	
	public void testParseFile() throws Exception {
		File parent = TestSupport.findTopTestingDir();
		File file = new File(parent, "1_NI_PlacePoints.json");

		FileInputStream fis = new FileInputStream(file);
		InputStreamReader isr = new InputStreamReader(fis, "UTF-8");
		
		GeoJsonParser geoJsonParser = new GeoJsonParser();
		//List<GeoJsonFeature> features = 
				geoJsonParser.parse(isr);
				
		fis.close();
	}
}
