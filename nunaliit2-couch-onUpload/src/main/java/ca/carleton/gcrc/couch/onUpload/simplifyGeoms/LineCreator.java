package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.util.Collections;
import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.geom.Point;

public class LineCreator {

	private List<Point> points;
	
	public LineCreator(Point point){
		points = new Vector<Point>();
		points.add(point);
	}
	
	public LineCreator(List<Point> points){
		this.points = points;
	}
	
	public Point firstPoint(){
		return points.get(0);
	}
	
	public Point lastPoint(){
		return points.get( points.size()-1 );
	}
	
	public List<Point> getPoints(){
		return points;
	}
	
	public double getDistance(LineCreator line) {
		double minDistance = computeDistance(firstPoint(), line.firstPoint());

		{
			double d = computeDistance(firstPoint(), line.lastPoint());
			if( minDistance > d ){
				minDistance = d;
			}
		}

		{
			double d = computeDistance(lastPoint(), line.firstPoint());
			if( minDistance > d ){
				minDistance = d;
			}
		}

		{
			double d = computeDistance(lastPoint(), line.lastPoint());
			if( minDistance > d ){
				minDistance = d;
			}
		}
		
		return minDistance;
	}
	
	public void addLine(LineCreator line) {
		double myFirstTheirFirst = computeDistance(firstPoint(), line.firstPoint());
		double myFirstTheirLast = computeDistance(firstPoint(), line.lastPoint());
		double myLastTheirFirst = computeDistance(lastPoint(), line.firstPoint());
		double myLastTheirLast = computeDistance(lastPoint(), line.lastPoint());

		if( myFirstTheirFirst < myFirstTheirLast 
		 && myFirstTheirFirst < myLastTheirFirst 
		 && myFirstTheirFirst < myLastTheirLast ){
			List<Point> points = new Vector<Point>();
			points.addAll( line.getPoints() );
			Collections.reverse(points);
			points.addAll(this.points);
			
			this.points = points;
			
		} else if( myFirstTheirLast < myLastTheirFirst 
				&& myFirstTheirLast < myLastTheirLast ) {
			List<Point> points = new Vector<Point>();
			points.addAll( line.getPoints() );
			points.addAll(this.points);
			
			this.points = points;
			
		} else if( myLastTheirFirst < myLastTheirLast ) {
			this.points.addAll( line.getPoints() );
			
		} else {
			// myLastTheirLast is smallest
			List<Point> theirPoints = new Vector<Point>();
			theirPoints.addAll( line.getPoints() );
			Collections.reverse(theirPoints);
			
			this.points.addAll(theirPoints);
		}
	}

	private double computeDistance(Point p1, Point p2) {
		double deltaX = p1.getX() - p2.getX();
		double deltaY = p1.getY() - p2.getY();
		double distance = Math.sqrt( (deltaX * deltaX) + (deltaY * deltaY) );
		return distance;
	}
}
