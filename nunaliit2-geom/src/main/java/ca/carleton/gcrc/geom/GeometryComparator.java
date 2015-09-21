package ca.carleton.gcrc.geom;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class GeometryComparator implements Comparator<Geometry> {

	@Override
	public int compare(Geometry g1, Geometry g2) {
		if( g1 == g2 ){
			return 0;
		}
		
		if( null == g1 ){
			return -1;
		}
		if( null == g2 ){
			return 1;
		}
		
		if( g1.getClass() != g2.getClass() ){
			return g1.getClass().getCanonicalName().compareTo( 
				g2.getClass().getCanonicalName() 
			);
		}

		if( g1 instanceof Point ){
			return comparePoints((Point)g1, (Point)g2);
		}
		if( g1 instanceof MultiPoint ){
			return compareMultiPoints((MultiPoint)g1, (MultiPoint)g2);
		}
		if( g1 instanceof LineString ){
			return compareLineStrings((LineString)g1, (LineString)g2);
		}
		if( g1 instanceof MultiLineString ){
			return compareMultiLineStrings((MultiLineString)g1, (MultiLineString)g2);
		}
		if( g1 instanceof Polygon ){
			return comparePolygons((Polygon)g1, (Polygon)g2);
		}
		if( g1 instanceof MultiPolygon ){
			return compareMultiPolygons((MultiPolygon)g1, (MultiPolygon)g2);
		}
		if( g1 instanceof GeometryCollection ){
			return compareCollections(
				((GeometryCollection)g1).getGeometries(), 
				((GeometryCollection)g2).getGeometries()
			);
		}
		
		return 0;
	}
	
	public int compareCollections(List<? extends Geometry> points1, List<? extends Geometry> points2){
		if( points1.size() != points2.size() ){
			return points1.size() - points2.size();
		}
		
		List<Geometry> sortedPoints1 = new ArrayList<Geometry>(points1);
		List<Geometry> sortedPoints2 = new ArrayList<Geometry>(points2);
		
		Collections.sort(sortedPoints1, this);
		Collections.sort(sortedPoints2, this);
		
		for(int i=0,e=sortedPoints1.size(); i<e; ++i){
			Geometry p1 = sortedPoints1.get(i);
			Geometry p2 = sortedPoints2.get(i);
			
			int c = compare(p1, p2);
			if( c != 0 ){
				return c;
			}
		}
		
		return 0;
	}
	
	public int comparePoints(Point p1, Point p2){
		if( p1 == p2 ){
			return 0;
		}
		
		if( null == p1 ){
			return -1;
		}
		if( null == p2 ){
			return 1;
		}
		
		if( p1.getX() < p2.getX() ){
			return -1;
		}
		if( p1.getX() > p2.getX() ){
			return 1;
		}
		if( p1.getY() < p2.getY() ){
			return -1;
		}
		if( p1.getY() > p2.getY() ){
			return 1;
		}
		return 0;
	}
	
	public int compareMultiPoints(MultiPoint p1, MultiPoint p2){
		if( p1 == p2 ){
			return 0;
		}
		
		if( null == p1 ){
			return -1;
		}
		if( null == p2 ){
			return 1;
		}
		
		return compareCollections(p1.getPoints(), p2.getPoints());
	}
	
	public int compareLineStrings(LineString l1, LineString l2){
		if( l1 == l2 ){
			return 0;
		}
		
		if( null == l1 ){
			return -1;
		}
		if( null == l2 ){
			return 1;
		}
		
		List<Point> points1 = l1.getPoints();
		List<Point> points2 = l2.getPoints();
		
		if( points1.size() != points2.size() ){
			return points1.size() - points2.size();
		}
		
		for(int i=0,e=points1.size(); i<e; ++i){
			Point p1 = points1.get(i);
			Point p2 = points2.get(i);
			
			int c = comparePoints(p1, p2);
			if( c != 0 ){
				return c;
			}
		}
		
		return 0;
	}

	public int compareMultiLineStrings(MultiLineString l1, MultiLineString l2){
		if( l1 == l2 ){
			return 0;
		}
		
		if( null == l1 ){
			return -1;
		}
		if( null == l2 ){
			return 1;
		}
		
		return compareCollections(l1.getLineStrings(), l2.getLineStrings());
	}

	public int comparePolygons(Polygon p1, Polygon p2){
		if( p1 == p2 ){
			return 0;
		}
		
		if( null == p1 ){
			return -1;
		}
		if( null == p2 ){
			return 1;
		}
		
		List<LineString> rings1 = p1.getLinearRings();
		List<LineString> rings2 = p2.getLinearRings();
		
		if( rings1.size() != rings2.size() ){
			return rings1.size() - rings2.size();
		}
		
		for(int i=0,e=rings1.size(); i<e; ++i){
			LineString l1 = rings1.get(i);
			LineString l2 = rings2.get(i);
			
			int c = compareLineStrings(l1, l2);
			if( c != 0 ){
				return c;
			}
		}
		
		return 0;
	}

	public int compareMultiPolygons(MultiPolygon mp1, MultiPolygon mp2){
		if( mp1 == mp2 ){
			return 0;
		}
		
		if( null == mp1 ){
			return -1;
		}
		if( null == mp2 ){
			return 1;
		}
		
		return compareCollections(mp1.getPolygons(), mp2.getPolygons());
	}
}
