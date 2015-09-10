package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.GeometryCollection;
import ca.carleton.gcrc.geom.GeometryComparator;
import ca.carleton.gcrc.geom.LineString;
import ca.carleton.gcrc.geom.MultiLineString;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.MultiPolygon;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.Polygon;

public class GeometrySimplificationProcessImpl implements GeometrySimplificationProcess {
	
	static private int pointRadius = 3;

	private List<Double> resolutions = null;
	
	public GeometrySimplificationProcessImpl(List<Double> resolutions){
		this.resolutions = new ArrayList<Double>(resolutions);
		Collections.sort( this.resolutions );
	}
	
	@Override
	public GeometrySimplificationReport simplifyGeometry(Geometry geometry) throws Exception {
		GeometryComparator geomComparator = new GeometryComparator();
		
		try {
			GeometrySimplificationReport report = new GeometrySimplificationReport();
			
			report.setOriginal(geometry);
			
			if( geometry instanceof Point ){
				// Do not simplify points
			} else {
				Geometry lastGeometry = null;
				for(Double resolution : resolutions){
					try {
						Geometry simplifiedGeom = simplifyGeometryAtResolution(geometry, resolution);
						
						boolean shouldSave = false;
						if( null == simplifiedGeom 
						 && null == lastGeometry ){
							// If original is more simplified than the highest resolution,
							// then save original for that resolution
							shouldSave = true;
							simplifiedGeom = geometry;
							lastGeometry = simplifiedGeom;
							
						} else if( null != simplifiedGeom ){
							
							if( null == lastGeometry ){
								shouldSave = true;
								lastGeometry = simplifiedGeom;
							} else {
								if( lastGeometry instanceof Point ){
									// Do not need to simplify a point
									shouldSave = false;
									
								} else if( 0 != geomComparator.compare(lastGeometry, simplifiedGeom) ){
									// save only if this is a different geometry
									shouldSave = true;
									lastGeometry = simplifiedGeom;
								}
							}
						}
						
						if( shouldSave ){
							GeometrySimplification simplification = new GeometrySimplification(resolution,simplifiedGeom);
							report.addSimplification(simplification);
						}

					} catch (Exception e) {
						throw new Exception("Error simplifying geometry at resolution "+resolution,e);
					}
				}
			}
			
			return report;
		} catch (Exception e) {
			throw new Exception("Error simplifying geometry: "+geometry.toString(),e);
		}
	}
	
	/**
	 * Accepts a geometry and a resolution. Returns a version of the geometry
	 * which is simplified for the given resolution. If the initial geometry
	 * is already simplified enough, then return null.
	 * @param geometry Geometry to simplify
	 * @param resolution Resolution at which the geometry should be simplified
	 * @return The simplified geometry. Null, if no simplification is possible.
	 * @throws Exception
	 */
	public Geometry simplifyGeometryAtResolution(Geometry geometry, double resolution) throws Exception {
		double inverseRes = 1/resolution;
		double p = Math.log10(inverseRes);
		double exp = Math.ceil( p );
		if( exp < 0 ) exp = 0;
		double factor = Math.pow(10,exp);

		Geometry simplifiedGeometry = simplify(geometry, resolution, factor);
		
		return simplifiedGeometry;
	}
	
	/**
	 * This function accepts a geometry and simplifies it, if possible. If it is able
	 * to simplify the geometry, then it returns the simplified version. If it is unable
	 * to simplify the geometry, it returns null.
	 * @param geom
	 * @param resolution
	 * @param factor
	 * @return
	 */
	private Geometry simplify(Geometry geom, double resolution, double factor){
		Geometry simplifiedGeometry = null;
		
		if( geom instanceof GeometryCollection ){
			GeometryCollection collection = (GeometryCollection)geom;
			boolean isSimplified = false;
			//List<Geometry> newComponents = new Vector<Geometry>();
			
			// Extract basic geometries
			List<Geometry> basicGeometries = new Vector<Geometry>();
			collection.accumulateBasicGeometries(basicGeometries);
			
			List<Point> accumulatedPoints = new Vector<Point>();
			List<LineString> accumulatedLineStrings = new Vector<LineString>();
			List<Polygon> accumulatedPolygons = new Vector<Polygon>();
			
			for(Geometry component : basicGeometries){
				if( component instanceof Point ){
					Point p = (Point)component;
					accumulatedPoints.add(p);
				
				} else if( component instanceof LineString ){
					LineString ls = (LineString)component;
					accumulatedLineStrings.add(ls);
					
				} else if( component instanceof Polygon ){
					Polygon poly = (Polygon)component;
					accumulatedPolygons.add(poly);
				}
			}
			
			List<Geometry> newComponents = new Vector<Geometry>();

			// Deal with polygons in one simplification
			if( accumulatedPolygons.size() > 0 ){
				MultiPolygon polygons = new MultiPolygon(accumulatedPolygons);
				Geometry effectiveComponent = simplify(polygons, resolution, factor);
				if( null != effectiveComponent ){
					isSimplified = true;
					newComponents.add(effectiveComponent);
				} else {
					newComponents.add(polygons);
				}
			}

			// Deal with linestrings in one simplification
			if( accumulatedLineStrings.size() > 0 ){
				MultiLineString linestrings = new MultiLineString(accumulatedLineStrings);
				Geometry effectiveComponent = simplify(linestrings, resolution, factor);
				if( null != effectiveComponent ){
					isSimplified = true;
					newComponents.add(effectiveComponent);
				} else {
					newComponents.add(linestrings);
				}
			}

			// Deal with points in one simplification
			if( accumulatedPoints.size() > 0 ){
				MultiPoint points = new MultiPoint(accumulatedPoints);
				Geometry effectiveComponent = simplify(points, resolution, factor);
				if( null != effectiveComponent ){
					isSimplified = true;
					newComponents.add(effectiveComponent);
				} else {
					newComponents.add(points);
				}
			}
			
			if( isSimplified ){
				simplifiedGeometry = new GeometryCollection(newComponents);
			}
			
		} else if( geom instanceof Point ) {
//			Point point = (Point)geom;
//			
//			double x = Math.round(point.getX() * factor) / factor;
//			double y = Math.round(point.getY() * factor) / factor;
//			if( x != point.getX() 
//			 || y != point.getY() ){
//				simplifiedGeometry = new Point(x,y);
//			}
			
		} else if( geom instanceof LineString ) {
			// The simplification of a LineString might result into a LineString
			// or into a point
			LineString lineString = (LineString)geom;
			boolean isGeneralized = false;
			List<Point> accumulatedPoints = new Vector<Point>();
			Point lastPoint = null;
			
			// Keep track of bounds
			BoundingBox bbox = new BoundingBox();
			
			for(Point point : lineString.getPoints()){
				// Keep track of bounds
				bbox.extendToInclude(point);
				
				Geometry simplifiedPointObj = simplify(point, resolution, factor);
				
				Point simplifiedPoint = null;
				if( null != simplifiedPointObj ){
					isGeneralized = true;
					simplifiedPoint = (Point)simplifiedPointObj;
				} else {
					simplifiedPoint = point;
				}
				
				if( null == lastPoint ){
					lastPoint = simplifiedPoint;
					accumulatedPoints.add(simplifiedPoint);
				} else {
					if( areLocationsColliding(simplifiedPoint, lastPoint, resolution) ){
						isGeneralized = true;
					} else {
						lastPoint = simplifiedPoint;
						accumulatedPoints.add(simplifiedPoint);
					}
				}
			}

			if( isGeneralized ){
				// A change occurred
				if( accumulatedPoints.size() < 2 ){
					// Create a point that represents the centre of the line string
					simplifiedGeometry = bbox.getCentroid();
				} else {
					simplifiedGeometry = new LineString(accumulatedPoints);
				};
			};
			
		} else if( geom instanceof Polygon ) {
			// Might return a polygon or a point
			Polygon polygon = (Polygon)geom;
			boolean newPolygonNeeded = false;
			List<LineString> newRings = new Vector<LineString>();
			
			// First linear ring is the outer limit of polygon
			List<LineString> rings = polygon.getLinearRings();
			LineString firstRing = rings.get(0);
			Geometry simplifiedFirstRing = simplify(firstRing, resolution, factor);
			if( null != simplifiedFirstRing ){
				if( simplifiedFirstRing instanceof Point ){
					// The outer ring was turned into a point. The whole
					// polygon is now a point. Do not process the other rings.
					// Abort and return the point.
					return simplifiedFirstRing;
				} else {
					newPolygonNeeded = true;
					LineString simplifiedLineString = (LineString)simplifiedFirstRing;
					newRings.add(simplifiedLineString);
				}
			} else {
				newRings.add(firstRing);
			}
			
			// The following rings are subtractions from the outer ring
			for(int i=1,e=rings.size(); i<e; ++i){
				LineString innerRing = rings.get(i);
				
				Geometry simplifiedInnerRing = simplify(innerRing,resolution,factor);
				if( null != simplifiedInnerRing ){
					newPolygonNeeded = true;
					if( simplifiedInnerRing instanceof Point ){
						// Drop inner ring
					} else {
						LineString simplifiedLineString = (LineString)simplifiedInnerRing;
						newRings.add(simplifiedLineString);
					}
				} else {
					newRings.add(innerRing);
				}
			}
			
			if( newPolygonNeeded ){
				simplifiedGeometry = new Polygon(newRings);
			}
			
		} else if( geom instanceof MultiPoint ) {
			// A MultiPoint can be simplified into a MultiPoint or
			// a simple Point
			MultiPoint multiPoint = (MultiPoint)geom;
			boolean isGeneralized = false;
			List<Point> accumulatedPoints = new Vector<Point>();
			Point lastPoint = null;
			
			for(Point point : multiPoint.getPoints()){
				Point effectivePoint = point;
				Geometry simplifiedPoint = simplify(point,resolution,factor);
				if( null != simplifiedPoint ){
					isGeneralized = true;
					effectivePoint = (Point)simplifiedPoint;
				}
				
				if( null == lastPoint ) {
					lastPoint = effectivePoint;
					accumulatedPoints.add(effectivePoint);
				} else {
					if( areLocationsColliding(effectivePoint, accumulatedPoints, resolution) ){
						// If this points is colliding with other points, do not
						// add to resulting collection
						isGeneralized = true;
					} else {
						lastPoint = effectivePoint;
						accumulatedPoints.add(effectivePoint);
					}
				}
			}
			
			if( isGeneralized ){
				if( accumulatedPoints.size() < 2 ){
					simplifiedGeometry = accumulatedPoints.get(0);
				} else {
					simplifiedGeometry = new MultiPoint(accumulatedPoints);
				}
			}
			
		} else if( geom instanceof MultiLineString ) {
			// A MultiLineString can be simplified into a MultiLineString, a LineString,
			// a MultiPoint or a Point
			MultiLineString multiLineString = (MultiLineString)geom;
			
			List<LineString> effectiveLineStrings = makeLineStrings(
					multiLineString.getLineStrings(), 
					null, 
					resolution
					);
			
			boolean isGeneralized = false;
			List<LineString> accumulatedLineStrings = new Vector<LineString>();
			List<Point> accumulatedPoints = new Vector<Point>();
			for(LineString lineString : effectiveLineStrings){
				Geometry simplifiedLineString = simplify(lineString, resolution, factor);
				if( null != simplifiedLineString ){
					isGeneralized = true;
					if( simplifiedLineString instanceof Point ){
						Point simplifiedPoint = (Point)simplifiedLineString;
						if( false == areLocationsColliding(simplifiedPoint, accumulatedPoints, resolution) ){
							accumulatedPoints.add(simplifiedPoint);
						}
					} else {
						LineString simplifiedLS = (LineString)simplifiedLineString;
						accumulatedLineStrings.add(simplifiedLS);
					}
				} else {
					accumulatedLineStrings.add(lineString);
				}
			}
			
			if( isGeneralized ){
				if( accumulatedLineStrings.size() > 1 ){
					simplifiedGeometry = new MultiLineString(accumulatedLineStrings);
					
				} else if( accumulatedLineStrings.size() == 1 ){
					simplifiedGeometry = accumulatedLineStrings.get(0);
					
				} else if( accumulatedPoints.size() > 1 ){
					simplifiedGeometry = new MultiPoint(accumulatedPoints);
					
				} else if( accumulatedPoints.size() == 1 ){
					simplifiedGeometry = accumulatedPoints.get(0);
				}
			}
			
		} else if( geom instanceof MultiPolygon ) {
			// A MultiPolygon can be simplified into a MultiPolygon, a Polygon,
			// a MultiPoint or a Point
			MultiPolygon multiPolygon = (MultiPolygon)geom;
			boolean isGeneralized = false;
			List<Polygon> accumulatedPolygons = new Vector<Polygon>();
			List<Point> accumulatedPoints = new Vector<Point>();
			for(Polygon polygon : multiPolygon.getPolygons()){
				Geometry simplifiedPolygon = simplify(polygon, resolution, factor);
				if( null != simplifiedPolygon ){
					isGeneralized = true;
					if( simplifiedPolygon instanceof Point ){
						Point simplifiedPoint = (Point)simplifiedPolygon;
						if( false == areLocationsColliding(simplifiedPoint, accumulatedPoints, resolution) ){
							accumulatedPoints.add(simplifiedPoint);
						}
					} else {
						Polygon simplifiedPoly = (Polygon)simplifiedPolygon;
						accumulatedPolygons.add(simplifiedPoly);
					}
				} else {
					accumulatedPolygons.add(polygon);
				}
			}
			
			if( isGeneralized ){
				if( accumulatedPolygons.size() > 1 ){
					simplifiedGeometry = new MultiPolygon(accumulatedPolygons);
					
				} else if( accumulatedPolygons.size() == 1 ){
					simplifiedGeometry = accumulatedPolygons.get(0);
					
				} else if( accumulatedPoints.size() > 1 ){
					simplifiedGeometry = new MultiPoint(accumulatedPoints);
					
				} else if( accumulatedPoints.size() == 1 ){
					simplifiedGeometry = accumulatedPoints.get(0);
				}
			}
		}
		
		return simplifiedGeometry;
	}
	
	private boolean areLocationsColliding(Point p1, Point p2, double resolution){
		double xDelta = Math.abs( p1.getX() - p2.getX() );
		double yDelta = Math.abs( p1.getY() - p2.getY() );
		
		if( xDelta > resolution || yDelta > resolution ){
			return false;
		}
		
		return true;
	}

	private boolean areLocationsColliding(Point p, List<Point> points, double resolution){
		for(Point point : points){
			if( areLocationsColliding(p, point, resolution) ){
				return true;
			}
		}

		return false;
	}
	
	private List<LineString> makeLineStrings(
			List<LineString> lineStrings, 
			List<Point> points, 
			double resolution ){
		List<LineCreator> lines = new Vector<LineCreator>();
		
		if( null != lineStrings ){
			for(LineString ls : lineStrings){
				lines.add( new LineCreator(ls.getPoints()) );
			}
		}
		
		if( null != points ){
			for(Point point : points){
				lines.add( new LineCreator(point) );
			}
		}
		
		boolean merged = mergeLineCreators(lines, resolution);
		while(merged){
			merged = mergeLineCreators(lines, resolution);
		}

		List<LineString> result = new Vector<LineString>();
		for(LineCreator lc : lines){
			if( null != lc && lc.getPoints().size() > 1 ){
				result.add( new LineString(lc.getPoints()) );
			}
		}
		
		return result;
	}

	private boolean mergeLineCreators(List<LineCreator> lines, double resolution){
		boolean merged = false;
		
		// System.out.println("mergeLineCreators "+lines.size());
		
		for(int i=0; i<lines.size(); ++i){
			LineCreator lc1 = lines.get(i);
			
			if( null != lc1 ){
				for(int j=i+1; j<lines.size(); ++j){
					LineCreator lc2 = lines.get(j);
					
					if( null != lc2 ){
						double distance = lc1.getDistance(lc2);
						
						if( distance <= (resolution * pointRadius) ){
							lc1.addLine( lc2 );
							lines.set(j, null);
							merged = true;
						}
					}
				}
			}
		}
		
		return merged;
	}
}
