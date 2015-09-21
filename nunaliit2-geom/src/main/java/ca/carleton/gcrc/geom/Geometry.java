package ca.carleton.gcrc.geom;

import java.util.Collection;

public interface Geometry {

	BoundingBox getBoundingBox();
	
	void extendBoundingBox(BoundingBox boundingBox);
	
	/**
	 * Unravels all the geometry collections and saves the basic
	 * geometries (Point, LineString, Polygon) into the given
	 * collection.
	 * @param geometries Collection where the basic geometries
	 * are saved.
	 */
	void accumulateBasicGeometries(Collection<Geometry> geometries);
}
