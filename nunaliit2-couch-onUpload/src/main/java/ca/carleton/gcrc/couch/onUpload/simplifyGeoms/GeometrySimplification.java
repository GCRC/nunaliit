package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import ca.carleton.gcrc.geom.Geometry;

public class GeometrySimplification {

	private double resolution;
	private Geometry geometry;
	
	public GeometrySimplification(double resolution, Geometry geometry){
		this.resolution = resolution;
		this.geometry = geometry;
	}

	public double getResolution() {
		return resolution;
	}

	public Geometry getGeometry() {
		return geometry;
	}
}
