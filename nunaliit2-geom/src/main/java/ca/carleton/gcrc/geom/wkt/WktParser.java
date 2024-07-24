package ca.carleton.gcrc.geom.wkt;

import java.io.BufferedReader;
import java.io.Reader;
import java.io.StringReader;
import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;

public class WktParser {

	public WktParser(){
		
	}
	
	public Geometry parseWkt(String wktString) throws Exception {
		try {
			StringReader sr = new StringReader(wktString);
			return parseWkt(sr);
		} catch (Exception e) {
			throw new Exception("Error parsing WKT string: "+wktString);
		}
	}
	
	public Geometry parseWkt(Reader reader) throws Exception {
		BufferedReader bufReader = new BufferedReader(reader);
		return parseGeometry(bufReader);
	}

	private boolean isWKTEmpty(BufferedReader br) throws Exception {
		String geomData = readIdentifier(br);
		return geomData.equalsIgnoreCase("empty");
	}
	
	private Geometry parseGeometry(BufferedReader bufReader) throws Exception {
		
		Geometry geometry = null;
		try {
			skipWhiteSpaces(bufReader);
			String identifier = readIdentifier(bufReader);
			if( "point".equalsIgnoreCase(identifier) ) {
				geometry = parsePoint(bufReader);
				
			} else if( "linestring".equalsIgnoreCase(identifier) ) {
				geometry = parseLineString(bufReader);
					
			} else if( "polygon".equalsIgnoreCase(identifier) ) {
				geometry = parsePolygon(bufReader);
				
			} else if( "multipoint".equalsIgnoreCase(identifier) ) {
				geometry = parseMultiPoint(bufReader);
				
			} else if( "multilinestring".equalsIgnoreCase(identifier) ) {
				geometry = parseMultiLineString(bufReader);
				
			} else if( "multipolygon".equalsIgnoreCase(identifier) ) {
				geometry = parseMultiPolygon(bufReader);
				
			} else if( "geometrycollection".equalsIgnoreCase(identifier) ) {
				geometry = parseGeometryCollection(bufReader);
					
			} else {
				throw new Exception("Unrecognized WKT type: "+identifier);
			}
			
		} catch(Exception e) {
			throw new Exception("Error occurred while parsing a WKT string", e);
		}
		
		return geometry;
	}
	
	private int skipWhiteSpaces(BufferedReader br) throws Exception {
		int numberOfWhite = 0;
		
		br.mark(1);
		int c = br.read();
		while( c >= 0 ){
			if( ' ' == c
			 || '\n' == c
			 || '\r' == c
			 || '\t' == c ) {
				// must skip this
				br.mark(1);
				c = br.read();
				++numberOfWhite;
			} else {
				// Return character to stream and exit
				br.reset();
				c = -1;
			}
		}
		
		return numberOfWhite;
	}
//	
//	private void popWhiteSpaces(BufferedReader br) throws Exception {
//		int c = skipWhiteSpaces(br);
//		if( c > 0 ) {
//			// good
//		} else {
//			throw new Exception("Expected a whitespace");
//		}
//	}
	
	private void popLeftParen(BufferedReader br) throws Exception {
		int c = br.read();
		if( '(' == c ) {
			// good
		} else {
			throw new Exception("Expected '('");
		}
	}
	
	private void popRightParen(BufferedReader br) throws Exception {
		int c = br.read();
		if( ')' == c ) {
			// good
		} else {
			throw new Exception("Expected ')'");
		}
	}
	
	private void popComma(BufferedReader br) throws Exception {
		int c = br.read();
		if( ',' == c ) {
			// good
		} else {
			throw new Exception("Expected ','");
		}
	}
	
	private boolean checkForLeftParen(BufferedReader br) throws Exception {
		br.mark(1);
		int c = br.read();
		br.reset();
		if( '(' == c ) {
			return true;
		} else {
			return false;
		}
	}
	
	private boolean checkForRightParen(BufferedReader br) throws Exception {
		br.mark(1);
		int c = br.read();
		br.reset();
		if( ')' == c ) {
			return true;
		} else {
			return false;
		}
	}
	
	private boolean checkForRightParenOrComma(BufferedReader br) throws Exception {
		br.mark(1);
		int c = br.read();
		br.reset();
		if( ')' == c ) {
			return true;
		} else if( ',' == c ) {
			return true;
		} else {
			return false;
		}
	}
	
	private String readIdentifier(BufferedReader br) throws Exception {
		StringBuilder sb = new StringBuilder();
		
		br.mark(1);
		int c = br.read();
		while( c >= 0 ){
			if( c >= 'a'
			 && c <= 'z' ) {
				// must keep this
				sb.append( (char)c );
				
				br.mark(1);
				c = br.read();
				
			} else if( c >= 'A'
			 && c <= 'Z' ) {
				// must keep this
				sb.append( (char)c );
				
				br.mark(1);
				c = br.read();
				
			} else {
				// Return character to stream and exit
				br.reset();
				c = -1;
			}
		}
		
		return sb.toString();
	}
	
	private double parsePosition(BufferedReader br) throws Exception {
		StringBuilder sb = new StringBuilder();
		int significant = 0;

		// Parse sign
		br.mark(1);
		int c = br.read();
		if( '+' == c ) {
			// OK
		} else if( '-' == c ) {
			sb.append( (char)c );
		} else {
			br.reset();
		}
		
		// Parse integer portion
		br.mark(1);
		c = br.read();
		while( c >= '0' && c <= '9' ){
			sb.append( (char)c );
			++significant;
			
			br.mark(1);
			c = br.read();
		}
		br.reset();
		
		// Check for decimal
		br.mark(1);
		c = br.read();
		if( c != '.' ) {
			br.reset();
		} else {
			sb.append( (char)c );
			
			// Parse decimal portion
			br.mark(1);
			c = br.read();
			while( c >= '0' && c <= '9' ){
				sb.append( (char)c );
				++significant;
				
				br.mark(1);
				c = br.read();
			}
			br.reset();
		}
		
		if( significant < 1 ) {
			throw new Exception("Expected a position");
		}
		
		double position = Double.parseDouble( sb.toString() );
		return position;
	}
	
	private List<Number> parsePositions(BufferedReader br) throws Exception {
		List<Number> positions = new Vector<Number>();
		
		skipWhiteSpaces(br);
		
		double position = parsePosition(br);
		positions.add(position);
		
		int whites = skipWhiteSpaces(br);
		boolean isEndOfPositions = checkForRightParen(br);
		while( false == isEndOfPositions && whites > 0 ){
			position = parsePosition(br);
			positions.add(position);
			
			whites = skipWhiteSpaces(br);
			isEndOfPositions = checkForRightParenOrComma(br);
		}
		
		return positions;
	}
	
	private Point parsePoint(BufferedReader br) throws Exception {
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return new Point();
		}

		popLeftParen(br);
		
		List<Number> positions = parsePositions(br);
		if( positions.size() < 2 ){
			throw new Exception("A point must have 2 or more positions");
		}
		
		skipWhiteSpaces(br);
		popRightParen(br);

		Point point = new Point(positions);
		return point;
	}
	
	private LineString parseLineString(BufferedReader br) throws Exception {
		LineString lineString = new LineString();
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return lineString;
		}

		popLeftParen(br);
		
		// Accumulate points
		boolean done = false;
		do {
			List<Number> positions = parsePositions(br);
			if( positions.size() < 2 ){
				throw new Exception("A point must have 2 or more positions");
			}

			Point point = new Point(positions);
			lineString.addPoint(point);
			
			if( checkForRightParen(br) ) {
				done = true;
			} else {
				popComma(br);
			}
			
		} while( !done );
		
		popRightParen(br);
		
		return lineString;
	}
	
	private Polygon parsePolygon(BufferedReader br) throws Exception {
		Polygon polygon = new Polygon();
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return polygon;
		}

		popLeftParen(br);
		
		LineString ls = parseLineString(br);
		polygon.addLinearRing(ls);
		skipWhiteSpaces(br);
		while( false == checkForRightParen(br) ){
			popComma(br);
			
			ls = parseLineString(br);
			polygon.addLinearRing(ls);
			skipWhiteSpaces(br);
		}
		
		popRightParen(br);
		
		return polygon;
	}
	
	private MultiPoint parseMultiPoint(BufferedReader br) throws Exception {
		MultiPoint multiPoint = new MultiPoint();
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return multiPoint;
		}

		popLeftParen(br);
		
		boolean done = false;
		do {
			skipWhiteSpaces(br);
			if( checkForLeftParen(br) ) {
				Point point = parsePoint(br);
				multiPoint.addPoint(point);
			} else {
				List<Number> positions = parsePositions(br);
				if( positions.size() < 2 ){
					throw new Exception("A point must have 2 or more positions");
				}

				Point point = new Point(positions);
				multiPoint.addPoint(point);
			}

			if( checkForRightParen(br) ) {
				done = true;
			} else {
				popComma(br);
			}
			
		} while(!done);
		
		popRightParen(br);
		
		return multiPoint;
	}
	
	private MultiLineString parseMultiLineString(BufferedReader br) throws Exception {
		MultiLineString multiLineString = new MultiLineString();
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return multiLineString;
		}

		popLeftParen(br);
		
		boolean done = false;
		do {
			skipWhiteSpaces(br);

			LineString lineString = parseLineString(br);
			multiLineString.addLineString(lineString);

			if( checkForRightParen(br) ) {
				done = true;
			} else {
				popComma(br);
			}
			
		} while(!done);
		
		popRightParen(br);
		
		return multiLineString;
	}
	
	private MultiPolygon parseMultiPolygon(BufferedReader br) throws Exception {
		MultiPolygon multiPolygon = new MultiPolygon();
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return multiPolygon;
		}

		popLeftParen(br);
		
		boolean done = false;
		do {
			skipWhiteSpaces(br);

			Polygon polygon = parsePolygon(br);
			multiPolygon.addPolygon(polygon);

			if( checkForRightParen(br) ) {
				done = true;
			} else {
				popComma(br);
			}
			
		} while(!done);
		
		popRightParen(br);
		
		return multiPolygon;
	}
	
	private GeometryCollection parseGeometryCollection(BufferedReader br) throws Exception {
		GeometryCollection geometryCollection = new GeometryCollection();
		
		skipWhiteSpaces(br);

		if (isWKTEmpty(br)) {
			return geometryCollection;
		}

		popLeftParen(br);
		
		boolean done = false;
		do {
			skipWhiteSpaces(br);

			Geometry geometry = parseGeometry(br);
			geometryCollection.addGeometry(geometry);

			if( checkForRightParen(br) ) {
				done = true;
			} else {
				popComma(br);
			}
			
		} while(!done);
		
		popRightParen(br);
		
		return geometryCollection;
	}
}
