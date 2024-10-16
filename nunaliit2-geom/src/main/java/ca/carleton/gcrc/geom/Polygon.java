package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

public class Polygon extends GeometryAbstract implements Geometry {

	private List<LineString> linearRings;
	
	public Polygon(){
		linearRings = new Vector<LineString>();
	}
	
	public Polygon(List<LineString> linearRings) {
		this.linearRings = linearRings;
	}
	
	public List<LineString> getLinearRings(){
		return linearRings;
	}
	
	public void addLinearRing(LineString linearRing){
		linearRings.add(linearRing);
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);

		if (isEmpty()) {
			pw.print("POLYGON EMPTY");
			pw.flush();
			return sw.toString();
		}
		
		pw.print("POLYGON(");
		
		boolean firstLinearRing = true;
		for(LineString linearRing : linearRings){
			if( firstLinearRing ) {
				firstLinearRing = false;
			} else {
				pw.print(",");
			}
			
			pw.print("(");
			boolean firstPoint = true;
			for(Point point : linearRing.getPoints()) {
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
		}
		
		pw.print(")");
		pw.flush();
		
		return sw.toString();
	}

	@Override
	public void extendBoundingBox(BoundingBox boundingBox) {
		for(LineString lineString : linearRings){
			lineString.extendBoundingBox(boundingBox);
		}
	}

	@Override
	public void accumulateBasicGeometries(Collection<Geometry> geometries) {
		geometries.add(this);
	}

	@Override
	public boolean isEmpty() {
		return (getLinearRings().size() == 0);
	}
}
