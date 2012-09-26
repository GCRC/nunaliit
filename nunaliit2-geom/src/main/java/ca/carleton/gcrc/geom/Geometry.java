package ca.carleton.gcrc.geom;

public interface Geometry {

	BoundingBox getBoundingBox();
	
	void extendBoundingBox(BoundingBox boundingBox);
}
