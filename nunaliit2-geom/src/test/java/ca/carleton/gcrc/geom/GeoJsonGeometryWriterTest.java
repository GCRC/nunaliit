package ca.carleton.gcrc.geom;

import java.io.StringWriter;

import org.json.JSONWriter;

import ca.carleton.gcrc.geom.geojson.GeoJsonGeometryWriter;

import junit.framework.TestCase;

public class GeoJsonGeometryWriterTest extends TestCase {

	public void testPoint() throws Exception {
		Point point = new Point();
		point.addPosition(1);
		point.addPosition(2);
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, point);
		
		if( false == "{\"type\":\"Point\",\"coordinates\":[1,2]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}

	public void testLineString() throws Exception {
		LineString lineString = new LineString();
		lineString.addPoint( new Point(1,2) );
		lineString.addPoint( new Point(3,4) );
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, lineString);
		
		if( false == "{\"type\":\"LineString\",\"coordinates\":[[1,2],[3,4]]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}

	public void testPolygon() throws Exception {
		Polygon polygon = new Polygon();
		
		{
			LineString lineString = new LineString();
			lineString.addPoint( new Point(1,2) );
			lineString.addPoint( new Point(3,4) );
			lineString.addPoint( new Point(5,6) );
			lineString.addPoint( new Point(1,2) );
			
			polygon.addLinearRing(lineString);
		}
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, polygon);
		
		if( false == "{\"type\":\"Polygon\",\"coordinates\":[[[1,2],[3,4],[5,6],[1,2]]]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}

	public void testMultiPoint() throws Exception {
		MultiPoint multiPoint = new MultiPoint();
		multiPoint.addPoint( new Point(1,2) );
		multiPoint.addPoint( new Point(3,4) );
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, multiPoint);
		
		if( false == "{\"type\":\"MultiPoint\",\"coordinates\":[[1,2],[3,4]]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}

	public void testMultiLineString() throws Exception {
		MultiLineString multiLineString = new MultiLineString();
		
		{
			LineString lineString = new LineString();
			lineString.addPoint( new Point(1,2) );
			lineString.addPoint( new Point(3,4) );
			
			multiLineString.addLineString(lineString);
		}
		
		{
			LineString lineString = new LineString();
			lineString.addPoint( new Point(5,6) );
			lineString.addPoint( new Point(7,8) );
			
			multiLineString.addLineString(lineString);
		}
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, multiLineString);
		
		if( false == "{\"type\":\"MultiLineString\",\"coordinates\":[[[1,2],[3,4]],[[5,6],[7,8]]]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}

	public void testMultiPolygon() throws Exception {
		MultiPolygon multiPolygon = new MultiPolygon();
		
		{
			Polygon polygon = new Polygon();
			
			LineString linearRing = new LineString();
			linearRing.addPoint( new Point(0,0) );
			linearRing.addPoint( new Point(0,10) );
			linearRing.addPoint( new Point(10,10) );
			linearRing.addPoint( new Point(0,0) );
			polygon.addLinearRing(linearRing);
			
			multiPolygon.addPolygon(polygon);
		}
		
		{
			Polygon polygon = new Polygon();
			
			LineString linearRing = new LineString();
			linearRing.addPoint( new Point(100,0) );
			linearRing.addPoint( new Point(100,10) );
			linearRing.addPoint( new Point(110,10) );
			linearRing.addPoint( new Point(100,0) );
			polygon.addLinearRing(linearRing);
			
			multiPolygon.addPolygon(polygon);
		}
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, multiPolygon);
		
		if( false == "{\"type\":\"MultiPolygon\",\"coordinates\":[[[[0,0],[0,10],[10,10],[0,0]]],[[[100,0],[100,10],[110,10],[100,0]]]]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}

	public void testGeometryCollection() throws Exception {
		GeometryCollection geometryCollection = new GeometryCollection();
		
		{
			Point point = new Point(0,1);
			geometryCollection.addGeometry(point);
		}
		
		{
			MultiPoint multiPoint = new MultiPoint();
			multiPoint.addPoint( new Point(2,3) );
			multiPoint.addPoint( new Point(4,5) );
			geometryCollection.addGeometry(multiPoint);
		}
		
		StringWriter sw = new StringWriter();
		JSONWriter jsonWriter = new JSONWriter(sw);
		
		GeoJsonGeometryWriter geoWriter = new GeoJsonGeometryWriter();
		
		geoWriter.writeGeometry(jsonWriter, geometryCollection);
		
		if( false == "{\"type\":\"GeometryCollection\",\"geometries\":[{\"type\":\"Point\",\"coordinates\":[0,1]},{\"type\":\"MultiPoint\",\"coordinates\":[[2,3],[4,5]]}]}".equals(sw.toString()) ){
			fail("Unexpected output");
		}
	}
}
