package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;

public class Point extends GeometryAbstract implements Geometry {

	private List<Number> positions;
	
	public Point(){
		this.positions = new Vector<Number>();
	}

	public Point(double x, double y){
		positions = new Vector<Number>();
		positions.add(x);
		positions.add(y);
	}

	public Point(double x, double y, double z){
		positions = new Vector<Number>();
		positions.add(x);
		positions.add(y);
		positions.add(z);
	}
	
	public Point(List<Number> positions){
		this.positions = positions;
	}
	
	public List<Number> getPositions() {
		return positions;
	}
	
	public void addPosition(double position){
		positions.add( position );
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("POINT(");
		
		boolean first = true;
		for(Number p : positions){
			if( first ) {
				first = false;
			} else {
				pw.print(" ");
			}
			
			pw.print(p);
		}
		
		pw.print(")");
		pw.flush();
		
		return sw.toString();
	}

	@Override
	public void extendBoundingBox(BoundingBox boundingBox) {
		boundingBox.extendToInclude(this);
	}
}
