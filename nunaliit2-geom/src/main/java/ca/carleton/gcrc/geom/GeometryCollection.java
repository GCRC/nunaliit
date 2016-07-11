package ca.carleton.gcrc.geom;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

public class GeometryCollection extends GeometryAbstract implements Geometry {

	private List<Geometry> geometries;
	
	public GeometryCollection(){
		geometries = new Vector<Geometry>();
	}
	
	public GeometryCollection(List<Geometry> geometries){
		this.geometries = geometries;
	}
	
	public int size(){
		return geometries.size();
	}
	
	public List<Geometry> getGeometries(){
		return geometries;
	}
	
	public void addGeometry(Geometry geometry){
		geometries.add(geometry);
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("GEOMETRYCOLLECTION(");
		
		boolean firstGeometry = true;
		for(Geometry geometry : geometries) {
			if( firstGeometry ) {
				firstGeometry = false;
			} else {
				pw.print(",");
			}
			
			pw.print(geometry.toString());
		}
		
		pw.print(")");
		pw.flush();
		
		return sw.toString();
	}

	@Override
	public void extendBoundingBox(BoundingBox boundingBox) {
		for(Geometry geometry : geometries){
			geometry.extendBoundingBox(boundingBox);
		}
	}

	@Override
	public void accumulateBasicGeometries(Collection<Geometry> geometries) {
		for(Geometry geometry : this.geometries){
			geometry.accumulateBasicGeometries(geometries);
		}
	}
}
