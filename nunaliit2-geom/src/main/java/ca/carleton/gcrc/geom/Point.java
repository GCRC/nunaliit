package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collection;
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
	
	public Double getX(){
		Double x = null;
		if( positions.size() > 0 ){
			x = positions.get(0).doubleValue();
		}
			
		return x;
	}
	
	public Double getY(){
		Double y = null;
		if( positions.size() > 1 ){
			y = positions.get(1).doubleValue();
		}
			
		return y;
	}
	
	public Double getZ(){
		Double z = null;
		if( positions.size() > 2 ){
			z = positions.get(2).doubleValue();
		}
			
		return z;
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);

		if (getPositions().size() == 0) {
			pw.print("POINT EMPTY");
			pw.flush();
			return sw.toString();
		}
		
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

	@Override
	public void accumulateBasicGeometries(Collection<Geometry> geometries) {
		geometries.add(this);
	}
}
