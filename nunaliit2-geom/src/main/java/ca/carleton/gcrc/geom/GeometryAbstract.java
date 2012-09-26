package ca.carleton.gcrc.geom;

abstract class GeometryAbstract implements Geometry {

	@Override
	public BoundingBox getBoundingBox() {
		BoundingBox boundingBox = new BoundingBox();
		extendBoundingBox(boundingBox);
		return boundingBox;
	}
}
