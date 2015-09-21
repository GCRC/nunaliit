package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

public class MultiPolygon extends GeometryAbstract implements Geometry {

	private List<Polygon> polygons;
	
	public MultiPolygon(){
		polygons = new Vector<Polygon>();
	}
	
	public MultiPolygon(List<Polygon> polygons) {
		this.polygons = polygons;
	}
	
	public List<Polygon> getPolygons(){
		return polygons;
	}
	
	public void addPolygon(Polygon polygon){
		polygons.add(polygon);
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("MULTIPOLYGON(");

		boolean firstPolygon = true;
		for(Polygon polygon : polygons){
			if( firstPolygon ) {
				firstPolygon = false;
			} else {
				pw.print(",");
			}
			
			pw.print("(");

			boolean firstLinearRing = true;
			for(LineString linearRing : polygon.getLinearRings()){
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
		}
		
		pw.print(")");
		pw.flush();
		
		return sw.toString();
	}

	@Override
	public void extendBoundingBox(BoundingBox boundingBox) {
		for(Polygon polygon : polygons){
			polygon.extendBoundingBox(boundingBox);
		}
	}

	@Override
	public void accumulateBasicGeometries(Collection<Geometry> geometries) {
		for(Polygon polygon : this.polygons){
			polygon.accumulateBasicGeometries(geometries);
		}
	}
}
