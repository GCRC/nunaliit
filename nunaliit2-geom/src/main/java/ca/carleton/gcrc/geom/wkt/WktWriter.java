package ca.carleton.gcrc.geom.wkt;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.text.NumberFormat;

import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;

public class WktWriter {

	public String toWkt(Geometry geometry) throws Exception {
		StringWriter sw = new StringWriter();
		write(geometry, sw);
		return sw.toString();
	}
	
	public void write(Geometry geometry, Writer writer) throws Exception {
		PrintWriter pw = new PrintWriter(writer);
		write(geometry, null, pw);
	}
	
	public void write(Geometry geometry, NumberFormat numFormat, Writer writer) throws Exception {
		PrintWriter pw = new PrintWriter(writer);
		write(geometry, numFormat, pw);
	}

	public void write(Geometry geometry, PrintWriter pw) throws Exception {
		write(geometry, null, pw);
	}
	
	public void write(Geometry geometry, NumberFormat numFormat, PrintWriter pw) throws Exception {
		try {
			if( geometry instanceof Point ) {
				writePoint((Point)geometry, numFormat, pw);
				
			} else if( geometry instanceof LineString ) {
				writeLineString((LineString)geometry, numFormat, pw);
				
			} else if( geometry instanceof Polygon ) {
				writePolygon((Polygon)geometry, numFormat, pw);
				
			} else if( geometry instanceof MultiPoint ) {
				writeMultiPoint((MultiPoint)geometry, numFormat, pw);
				
			} else if( geometry instanceof MultiLineString ) {
				writeMultiLineString((MultiLineString)geometry, numFormat, pw);
				
			} else if( geometry instanceof MultiPolygon ) {
				writeMultiPolygon((MultiPolygon)geometry, numFormat, pw);
				
			} else if( geometry instanceof GeometryCollection ) {
				writeGeometryCollection((GeometryCollection)geometry, numFormat, pw);
				
			} else {
				throw new Exception("Unknown type: "+geometry.getClass().getName());
			}
		} catch(Exception e) {
			throw new Exception("Error while writing WKT from geometry",e);
		}
	}
	
	private void writePoint(Point point, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("POINT(");
		boolean firstPosition = true;
		for(Number position : point.getPositions()){
			if( firstPosition ) {
				firstPosition = false;
			} else {
				pw.write(" ");
			}
			
			writeNumber(pw, numFormat, position);
		}
		pw.write(")");
	}
	
	private void writeMultiPoint(MultiPoint multiPoint, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("MULTIPOINT(");
		boolean firstPoint = true;
		for(Point point : multiPoint.getPoints()){
			if( firstPoint ) {
				firstPoint = false;
			} else {
				pw.write(",");
			}

			pw.write("(");
			
			boolean firstPosition = true;
			for(Number position : point.getPositions()){
				if( firstPosition ) {
					firstPosition = false;
				} else {
					pw.write(" ");
				}
				
				writeNumber(pw, numFormat, position);
			}

			pw.write(")");
		}
		pw.write(")");
	}
	
	private void writeLineString(LineString lineString, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("LINESTRING(");
		boolean firstPoint = true;
		for(Point point : lineString.getPoints()){
			if( firstPoint ) {
				firstPoint = false;
			} else {
				pw.write(",");
			}

			boolean firstPosition = true;
			for(Number position : point.getPositions()){
				if( firstPosition ) {
					firstPosition = false;
				} else {
					pw.write(" ");
				}
				
				writeNumber(pw, numFormat, position);
			}
		}
		pw.write(")");
	}
	
	private void writeMultiLineString(MultiLineString multiLineString, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("MULTILINESTRING(");
		boolean firstLineString = true;
		for(LineString lineString : multiLineString.getLineStrings()){
			if( firstLineString ) {
				firstLineString = false;
			} else {
				pw.write(",");
			}

			pw.write("(");

			boolean firstPoint = true;
			for(Point point : lineString.getPoints()){
				if( firstPoint ) {
					firstPoint = false;
				} else {
					pw.write(",");
				}

				boolean firstPosition = true;
				for(Number position : point.getPositions()){
					if( firstPosition ) {
						firstPosition = false;
					} else {
						pw.write(" ");
					}
					
					writeNumber(pw, numFormat, position);
				}
			}

			pw.write(")");
		}
		pw.write(")");
	}
	
	private void writePolygon(Polygon polygon, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("POLYGON(");
		boolean firstLinearRing = true;
		for(LineString lineString : polygon.getLinearRings()){
			if( firstLinearRing ) {
				firstLinearRing = false;
			} else {
				pw.write(",");
			}

			pw.write("(");

			boolean firstPoint = true;
			for(Point point : lineString.getPoints()){
				if( firstPoint ) {
					firstPoint = false;
				} else {
					pw.write(",");
				}

				boolean firstPosition = true;
				for(Number position : point.getPositions()){
					if( firstPosition ) {
						firstPosition = false;
					} else {
						pw.write(" ");
					}
					
					writeNumber(pw, numFormat, position);
				}
			}

			pw.write(")");
		}
		pw.write(")");
	}
	
	private void writeMultiPolygon(MultiPolygon multiPolygon, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("MULTIPOLYGON(");
		
		boolean firstPolygon = true;
		for(Polygon polygon : multiPolygon.getPolygons()){
			if( firstPolygon ) {
				firstPolygon = false;
			} else {
				pw.write(",");
			}

			pw.write("(");
			
			boolean firstLinearRing = true;
			for(LineString lineString : polygon.getLinearRings()){
				if( firstLinearRing ) {
					firstLinearRing = false;
				} else {
					pw.write(",");
				}

				pw.write("(");

				boolean firstPoint = true;
				for(Point point : lineString.getPoints()){
					if( firstPoint ) {
						firstPoint = false;
					} else {
						pw.write(",");
					}

					boolean firstPosition = true;
					for(Number position : point.getPositions()){
						if( firstPosition ) {
							firstPosition = false;
						} else {
							pw.write(" ");
						}
						
						writeNumber(pw, numFormat, position);
					}
				}

				pw.write(")");
			}
			
			pw.write(")");
		}

		pw.write(")");
	}
	
	private void writeGeometryCollection(GeometryCollection geometryCollection, NumberFormat numFormat, PrintWriter pw) throws Exception {
		pw.write("GEOMETRYCOLLECTION(");
		boolean firstGeometry = true;
		for(Geometry geometry : geometryCollection.getGeometries()){
			if( firstGeometry ) {
				firstGeometry = false;
			} else {
				pw.write(",");
			}
			
			write(geometry, numFormat, pw);
		}
		pw.write(")");
	}
	
	/**
	 * Writes a number to the print writer. If the number is an integer, do not
	 * write the decimal points.
	 * @param pw
	 * @param num
	 */
	private void writeNumber(PrintWriter pw, NumberFormat numFormat, Number num){
		if( num.doubleValue() == Math.round(num.doubleValue()) ){
			// Integer
			if( null != numFormat ){
				pw.print( numFormat.format(num.intValue()) );
			} else {
				pw.print( num.intValue() );
			}
			
		} else {
			if( null != numFormat ){
				pw.print( numFormat.format(num) );
			} else {
				pw.print( num );
			}
		}
	}
}
