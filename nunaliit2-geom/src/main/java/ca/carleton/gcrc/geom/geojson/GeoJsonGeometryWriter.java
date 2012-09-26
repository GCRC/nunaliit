package ca.carleton.gcrc.geom.geojson;

import org.json.JSONWriter;

import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;

public class GeoJsonGeometryWriter {

	public void writeGeometry(JSONWriter writer, Geometry geometry) throws Exception {
		
		if( geometry instanceof Point ) {
			writePoint( writer, (Point)geometry );
			
		} else if( geometry instanceof LineString ) {
			writeLineString( writer, (LineString)geometry );
			
		} else if( geometry instanceof Polygon ) {
			writePolygon( writer, (Polygon)geometry );
			
		} else if( geometry instanceof MultiPoint ) {
			writeMultiPoint( writer, (MultiPoint)geometry );
			
		} else if( geometry instanceof MultiLineString ) {
			writeMultiLineString( writer, (MultiLineString)geometry );
			
		} else if( geometry instanceof MultiPolygon ) {
			writeMultiPolygon( writer, (MultiPolygon)geometry );
			
		} else if( geometry instanceof GeometryCollection ) {
			writeGeometryCollection( writer, (GeometryCollection)geometry );
			
		} else {
			throw new Exception("Unable to write geometry of class: "+geometry.getClass().getName());
		}
	}

	private void writePoint(JSONWriter writer, Point point)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("Point");

		writer.key("coordinates");
		
		writer.array();
		
		for(Number position : point.getPositions()){
			writer.value(position);
		}
		
		writer.endArray();
		
		writer.endObject();
	}

	private void writeLineString(JSONWriter writer, LineString lineString)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("LineString");

		writer.key("coordinates");
		
		writer.array();
		for(Point point : lineString.getPoints()){
			writer.array();
			
			for(Number position : point.getPositions()){
				writer.value(position);
			}
			
			writer.endArray();
		}
		writer.endArray();
		
		writer.endObject();
	}

	private void writePolygon(JSONWriter writer, Polygon polygon)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("Polygon");

		writer.key("coordinates");
		
		writer.array();
		for(LineString linearRing : polygon.getLinearRings()){
			writer.array();

			for(Point point : linearRing.getPoints()){
				writer.array();
				
				for(Number position : point.getPositions()){
					writer.value(position);
				}
				
				writer.endArray();
			}
			
			writer.endArray();
		}
		writer.endArray();
		
		
		writer.endObject();
	}

	private void writeMultiPoint(JSONWriter writer, MultiPoint multiPoint)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("MultiPoint");

		writer.key("coordinates");
		
		writer.array();
		for(Point point : multiPoint.getPoints()){
			writer.array();
			
			for(Number position : point.getPositions()){
				writer.value(position);
			}
			
			writer.endArray();
		}
		writer.endArray();
		
		
		writer.endObject();
	}

	private void writeMultiLineString(JSONWriter writer, MultiLineString multiLineString)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("MultiLineString");

		writer.key("coordinates");
		
		writer.array();
		for(LineString lineString : multiLineString.getLineStrings()){
			writer.array();
			for(Point point : lineString.getPoints()){
				writer.array();
				
				for(Number position : point.getPositions()){
					writer.value(position);
				}
				
				writer.endArray();
			}
			writer.endArray();
		}
		writer.endArray();
		
		
		writer.endObject();
	}

	private void writeMultiPolygon(JSONWriter writer, MultiPolygon multiPolygon)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("MultiPolygon");

		writer.key("coordinates");
		
		writer.array();
		for(Polygon polygon : multiPolygon.getPolygons()){
			writer.array();
			for(LineString lineString : polygon.getLinearRings()){
				writer.array();
				for(Point point : lineString.getPoints()){
					writer.array();
					
					for(Number position : point.getPositions()){
						writer.value(position);
					}
					
					writer.endArray();
				}
				writer.endArray();
			}
			writer.endArray();
		}
		writer.endArray();
		
		
		writer.endObject();
	}

	private void writeGeometryCollection(JSONWriter writer, GeometryCollection geometryCollection)  throws Exception {
		writer.object();
		
		writer.key("type");
		writer.value("GeometryCollection");

		writer.key("geometries");
		
		writer.array();
		for(Geometry geometry : geometryCollection.getGeometries()){
			writeGeometry(writer, geometry);
		}
		writer.endArray();
		
		
		writer.endObject();
	}
}
