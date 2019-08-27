package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

public class MultiPoint extends GeometryAbstract implements Geometry,GeometryAssembly {

	private List<Point> points;
	
	public MultiPoint(){
		this.points = new Vector<Point>();
	}
	
	public MultiPoint(List<Point> points){
		this.points = points;
	}

	@Override
	public int size() {
		return points.size();
	}

	@Override
	public List<Geometry> getGeometries() {
		ArrayList<Geometry> geometries = new ArrayList<Geometry>(points);
		return geometries;
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
		
		pw.print("MULTIPOINT(");
		
		boolean firstPoint = true;
		for(Point point : points) {
			if( firstPoint ) {
				firstPoint = false;
			} else {
				pw.print(",");
			}
			
			pw.print("(");
			boolean firstPosition = true;
			for(Number p : point.getPositions()){
				if( firstPosition ) {
					firstPosition = false;
				} else {
					pw.print(" ");
				}
				
				pw.print(p);
			}
			pw.print(")");
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
		for(Point point : this.points){
			point.accumulateBasicGeometries(geometries);
		}
	}
}
