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

	public void testEmptyWKT() throws Exception {
		Geometry geomPoint = (new WktParser()).parseWkt("POINT EMPTY");
		Geometry geomLineString = (new WktParser()).parseWkt("LINESTRING EMPTY");
		Geometry geomPolygon = (new WktParser()).parseWkt("POLYGON EMPTY");
		Geometry geomMultiPoint = (new WktParser()).parseWkt("MULTIPOINT EMPTY");
		Geometry geomMultiLineString = (new WktParser()).parseWkt("MULTILINESTRING EMPTY");
		Geometry geomMultiPolygon = (new WktParser()).parseWkt("MULTIPOLYGON EMPTY");
		Geometry geomGeometryCollection = (new WktParser()).parseWkt("GEOMETRYCOLLECTION EMPTY");

		if (false == (geomPoint instanceof Point)) fail("Expected an instance of Point");
		if (false == (geomLineString instanceof LineString)) fail("Expected an instance of LineString");
		if (false == (geomPolygon instanceof Polygon)) fail("Expected an instance of Polygon");
		if (false == (geomMultiPoint instanceof MultiPoint)) fail("Expected an instance of MultiPoint");
		if (false == (geomMultiLineString instanceof MultiLineString)) fail("Expected an instance of MultiLineString");
		if (false == (geomMultiPolygon instanceof MultiPolygon)) fail("Expected an instance of MultiPolygon");
		if (false == (geomGeometryCollection instanceof GeometryCollection)) fail("Expected an instance of GeometryCollection");

		Point point = (Point) geomPoint;
		if (point.getPositions().size() != 0) fail("Expected no positions");
		if (!point.toString().equals("POINT EMPTY")) fail("Unexpected WKT string for empty POINT");
		
		LineString ls = (LineString) geomLineString;
		if (ls.getPoints().size() != 0) fail("Expected no points");
		if (!ls.toString().equals("LINESTRING EMPTY")) fail("Unexpected WKT string for empty LINESTRING");
		
		Polygon polygon = (Polygon) geomPolygon;
		if (polygon.getLinearRings().size() != 0) fail("Expected no linear rings");
		if (!polygon.toString().equals("POLYGON EMPTY")) fail("Unexpected WKT string for empty POLYGON");
		
		MultiPoint multipoint = (MultiPoint) geomMultiPoint;
		if (multipoint.getPoints().size() != 0) fail("Expected no points");
		if (!multipoint.toString().equals("MULTIPOINT EMPTY")) fail("Unexpected WKT string for empty MULTIPOINT");
		
		MultiLineString multiLS = (MultiLineString) geomMultiLineString;
		if (multiLS.getLineStrings().size() != 0) fail("Expected no linestrings");
		if (!multiLS.toString().equals("MULTILINESTRING EMPTY")) fail("Unexpected WKT string for empty MULTILINESTRING");
		
		MultiPolygon multiPolygon = (MultiPolygon) geomMultiPolygon;
		if (multiPolygon.getPolygons().size() != 0) fail("Expected no polygons");
		if (!multiPolygon.toString().equals("MULTIPOLYGON EMPTY")) fail("Unexpected WKT string for empty MULTIPOLYGON");
		
		GeometryCollection gCollection = (GeometryCollection) geomGeometryCollection;
		if (gCollection.getGeometries().size() != 0) fail("Expected no geometries");
		if (!gCollection.toString().equals("GEOMETRYCOLLECTION EMPTY")) fail("Unexpected WKT string for empty GEOMETRYCOLLECTION");
	}

	public void testWKTWithWhitespaceParentheses() throws Exception {
		Geometry geom = (new WktParser()).parseWkt("MULTIPOINT(\r\n" + //
				"(-53 69),\r\n" + //
				"(-51 64),\r\n" + //
				"(-20 74)\r\n" + //
				")");
		if (false == (geom instanceof MultiPoint)) {
			fail("Expected an instance of MultiPoint");
		}
		
		Geometry geom2 = (new WktParser()).parseWkt("MULTIPOLYGON( ( (0 0, 0 10, 10 10, 0 0) ),( (100 100, 100 110, 110 110, 110 100, 100 100) ,(101 101, 101 102, 102 102, 101 101) ) )");
		if (false == (geom2 instanceof MultiPolygon)) {
			fail("Expected an instance of MultiPolygon");
		}
		
		Geometry geom3 = (new WktParser()).parseWkt("MULTIPOINT( (0 0)  ,  (0 10)          )");
		if (false == (geom3 instanceof MultiPoint)) {
			fail("Expected an instance of MultiPoint");
		}
		
		Geometry geom4 = (new WktParser()).parseWkt("POLYGON   (     (0 0, 0 10, 10 10, 10 0, 0 0)    ,         (1 1, 1 2, 2 2, 2 1, 1 1)        )  ");
		if (false == (geom4 instanceof Polygon)) {
			fail("Expected an instance of Polygon");
		}
	}
}
