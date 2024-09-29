package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

public class MultiLineString extends GeometryAbstract implements Geometry,GeometryAssembly {

	private List<LineString> lineStrings;
	
	public MultiLineString(){
		lineStrings = new Vector<LineString>();
	}
	
	public MultiLineString(List<LineString> lineStrings) {
		this.lineStrings = lineStrings;
	}

	@Override
	public int size() {
		return lineStrings.size();
	}

	@Override
	public List<Geometry> getGeometries() {
		ArrayList<Geometry> geometries = new ArrayList<Geometry>(lineStrings);
		return geometries;
	}
	
	public List<LineString> getLineStrings(){
		return lineStrings;
	}
	
	public void addLineString(LineString lineString){
		lineStrings.add(lineString);
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);

		if (isEmpty()) {
			pw.print("MULTILINESTRING EMPTY");
			pw.flush();
			return sw.toString();
		}
		
		pw.print("MULTILINESTRING(");
		
		boolean firstLinearRing = true;
		for(LineString linearRing : lineStrings){
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
		for(LineString lineString : lineStrings){
			lineString.extendBoundingBox(boundingBox);
		}
	}

	@Override
	public void accumulateBasicGeometries(Collection<Geometry> geometries) {
		for(LineString lineString : this.lineStrings){
			lineString.accumulateBasicGeometries(geometries);
		}
	}

	@Override
	public boolean isEmpty() {
		return (getLineStrings().size() == 0);
	}
}
