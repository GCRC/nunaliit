package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

public class LineString extends GeometryAbstract implements Geometry {

	private List<Point> points;
	
	public LineString(){
		this.points = new Vector<Point>();
	}
	
	public LineString(List<Point> points){
		this.points = points;
	}
	
	public List<Point> getPoints(){
		return points;
	}
	
	public void addPoint(Point point){
		points.add(point);
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("LINESTRING(");
		
		boolean firstPoint = true;
		for(Point point : points) {
			if( firstPoint ) {
				firstPoint = false;
			} else {
				pw.print(",");
			}
			
			boolean firstPosition = true;
			for(Number p : point.getPositions()){
				if( firstPosition ) {
					firstPosition = false;
				} else {
					pw.print(" ");
				}
				
				pw.print(p);
			}
		}
		
		pw.print(")");
		pw.flush();
		
		return sw.toString();
	}

	@Override
	public void extendBoundingBox(BoundingBox boundingBox) {
		for(Point point : points){
			boundingBox.extendToInclude(point);
		}
	}

	@Override
	public void accumulateBasicGeometries(Collection<Geometry> geometries) {
		geometries.add(this);
	}
}
