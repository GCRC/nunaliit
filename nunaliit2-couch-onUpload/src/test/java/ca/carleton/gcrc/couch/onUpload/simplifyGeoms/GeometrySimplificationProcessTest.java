package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryComparator;
import ca.carleton.gcrc.geom.wkt.WktParser;
import junit.framework.TestCase;

public class GeometrySimplificationProcessTest extends TestCase {

	public void testSimplifyGeometryAtResolution() throws Exception {
		WktParser parser = new WktParser();
		GeometryComparator geomComparator = new GeometryComparator();
		
		List<Double> resolutions = new Vector<Double>();
		resolutions.add(0.1);
		GeometrySimplificationProcessImpl process = new GeometrySimplificationProcessImpl(resolutions);
		double resolution = 0.1;

		Map<String,String> tests = new HashMap<String,String>();
		tests.put("POINT(10 13)","POINT(10 13)");
		tests.put("POINT(10.25 13)","POINT(10.25 13)");
		tests.put("MULTIPOINT((10.2 13),(11.2 14))","MULTIPOINT((10.2 13),(11.2 14))");
		tests.put("MULTIPOINT((10.28 13.02),(10.27 13.04))","POINT(10.28 13.02)");
		tests.put("LINESTRING(0 0,10 0,10 10,20 10)","LINESTRING(0 0,10 0,10 10,20 10)");
		tests.put("LINESTRING(0 0,10 0,10.01 0,20 0)","LINESTRING(0 0,10 0,20 0)");
		tests.put("LINESTRING(0 0,0.04 0,0.04 0.04)","POINT(0.02 0.02)");
		tests.put("MULTILINESTRING((0 0,10 0),(1 1,11 1))","MULTILINESTRING((0 0,10 0),(1 1,11 1))");
		tests.put("MULTILINESTRING((0 0,10 0),(1 1,1.04 1))","LINESTRING(0 0,10 0)");
		tests.put("MULTILINESTRING((0 0,0.04 0),(1 1,1.04 1))","MULTIPOINT((0.02 0),(1.02 1))");
		tests.put("MULTILINESTRING((0 0,0.04 0),(0.04 0,0.04 0.04))","POINT(0.02 0)");
		tests.put("POLYGON((0 0,10 0,10 10,0 10))","POLYGON((0 0,10 0,10 10,0 10))");
		tests.put(
			"POLYGON((0 0,10 0,10 10,0 10),(2 2,8 2,8 8,2 8))",
			"POLYGON((0 0,10 0,10 10,0 10),(2 2,8 2,8 8,2 8))");
		tests.put(
			"POLYGON((0 0,10 0,10 10,0 10),(2.00 2.00,2.04 2.00,2.04 2.04,2.00 2.04))",
			"POLYGON((0 0,10 0,10 10,0 10))");
		tests.put("POLYGON((0 0,0.04 0,0.04 0.04,0 0.04))","POINT(0.02 0.02)");
		tests.put(
			"MULTIPOLYGON(((0 0,1 0,1 1,0 1)),((3 0,6 0,6 3,3 3)))",
			"MULTIPOLYGON(((0 0,1 0,1 1,0 1)),((3 0,6 0,6 3,3 3)))");
		tests.put(
			"MULTIPOLYGON(((0 0,1 0,1 1,0 1)),((0.02 0.02,0.03 0.02,0.03 0.03,0.02 0.03)))",
			"POLYGON((0 0,1 0,1 1,0 1))");
		tests.put(
			"MULTIPOLYGON(((0 0,0.04 0,0.04 0.04,0 0.04)),((0.02 0.02,0.03 0.02,0.03 0.03,0.02 0.03)))",
			"POINT(0.02 0.02)");
		
		for(String wkt : tests.keySet()){
			String expectedWkt = tests.get(wkt);
			
			Geometry geom = parser.parseWkt(wkt);
			Geometry simplifiedGeom = process.simplifyGeometryAtResolution(geom, resolution);
			if( null == simplifiedGeom ){
				simplifiedGeom = geom;
			}
			
			Geometry expectedGeom = parser.parseWkt(expectedWkt);
			if( 0 != geomComparator.compare(simplifiedGeom, expectedGeom) ){
				fail("Unexpected result while simplifying: "+wkt+" result: "+simplifiedGeom.toString());
			}
		}
	}

	public void testSimplifyGeometry() throws Exception {
		WktParser parser = new WktParser();
		
		List<Double> resolutions = new Vector<Double>();
		resolutions.add(0.1);
		resolutions.add(1.0);
		resolutions.add(10.0);
		GeometrySimplificationProcessImpl process = new GeometrySimplificationProcessImpl(resolutions);

		String test = "POLYGON((0 0,10 0,10 10,0 10),(2 2,8 2,8 8,2 8))";
		Geometry geom = parser.parseWkt(test);
		//GeometrySimplificationReport report = 
				process.simplifyGeometry(geom);
	}
}
