package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.geom.Geometry;

public class GeometrySimplificationReport {

	private Geometry original;
	private List<GeometrySimplification> simplifications = new Vector<GeometrySimplification>();
	
	public GeometrySimplificationReport(){
		
	}

	public Geometry getOriginal() {
		return original;
	}

	public void setOriginal(Geometry original) {
		this.original = original;
	}

	public List<GeometrySimplification> getSimplifications() {
		return simplifications;
	}

	public void addSimplification(GeometrySimplification simplification) {
		this.simplifications.add(simplification);
	}
	
}
