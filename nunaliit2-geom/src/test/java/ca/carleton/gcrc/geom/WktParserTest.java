package ca.carleton.gcrc.geom;

import ca.carleton.gcrc.geom.wkt.WktParser;
import junit.framework.TestCase;

public class WktParserTest extends TestCase {

	public void testPoint() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("POINT(0.123 -123)");
		
		if( false == (geom instanceof Point) ){
			fail("Expected an instance of Point");
		}
		
		Point point = (Point)geom;
		if( point.getPositions().size() != 2 ) {
			fail("Expected two positions");
		}
	}

	public void testLineString() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("LINESTRING(0.123 -123, 10 40)");
		
		if( false == (geom instanceof LineString) ){
			fail("Expected an instance of LineString");
		}
		
		LineString lineString = (LineString)geom;
		if( lineString.getPoints().size() != 2 ) {
			fail("Expected two points");
		}
	}

	public void testPolygon() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))");
		
		if( false == (geom instanceof Polygon) ){
			fail("Expected an instance of Polygon");
		}
		
		Polygon polygon = (Polygon)geom;
		if( polygon.getLinearRings().size() != 1 ) {
			fail("Expected one linear ring");
		}
	}

	public void testPolygonWithHoles() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("POLYGON((0 0, 0 10, 10 10, 10 0, 0 0),(1 1, 1 2, 2 2, 2 1, 1 1))");
		
		if( false == (geom instanceof Polygon) ){
			fail("Expected an instance of Polygon");
		}
		
		Polygon polygon = (Polygon)geom;
		if( polygon.getLinearRings().size() != 2 ) {
			fail("Expected two linear rings");
		}
	}

	public void testMultiPointFormat1() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("MULTIPOINT((0 0),(0 10))");
		
		if( false == (geom instanceof MultiPoint) ){
			fail("Expected an instance of MultiPoint");
		}
		
		MultiPoint multiPoint = (MultiPoint)geom;
		if( multiPoint.getPoints().size() != 2 ) {
			fail("Expected two points");
		}
	}

	public void testMultiPointFormat2() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("MULTIPOINT(0 0, 0 10)");
		
		if( false == (geom instanceof MultiPoint) ){
			fail("Expected an instance of MultiPoint");
		}
		
		MultiPoint multiPoint = (MultiPoint)geom;
		if( multiPoint.getPoints().size() != 2 ) {
			fail("Expected two points");
		}
	}

	public void testMultiLineString() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("MULTILINESTRING((0 0, 0 10),(10 0, 10 10))");
		
		if( false == (geom instanceof MultiLineString) ){
			fail("Expected an instance of MultiLineString");
		}
		
		MultiLineString multiLineString = (MultiLineString)geom;
		if( multiLineString.getLineStrings().size() != 2 ) {
			fail("Expected two line strings");
		}
	}

	public void testMultiPolygon() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("MULTIPOLYGON(((0 0, 0 10, 10 10, 0 0)),((100 100, 100 110, 110 110, 110 100, 100 100),(101 101, 101 102, 102 102, 101 101)))");
		
		if( false == (geom instanceof MultiPolygon) ){
			fail("Expected an instance of MultiPolygon");
		}
		
		MultiPolygon multiPolygon = (MultiPolygon)geom;
		if( multiPolygon.getPolygons().size() != 2 ) {
			fail("Expected two polygons");
		}
	}

	public void testGeometryCollection() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(3 4, 5 6))");
		
		if( false == (geom instanceof GeometryCollection) ){
			fail("Expected an instance of GeometryCollection");
		}
		
		GeometryCollection geometryCollection = (GeometryCollection)geom;
		if( geometryCollection.getGeometries().size() != 2 ) {
			fail("Expected two geometries");
		}
	}
}
