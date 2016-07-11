package ca.carleton.gcrc.geom;

import java.util.List;

/**
 * A collection of geometries
 *
 */
public interface GeometryAssembly {

	/**
	 * Returns the size of the geometry collection
	 * @return Size of collection
	 */
	int size();
	
	/**
	 * Returns the geometries that make up this assembly.
	 * @return Geometries in this collection
	 */
	List<Geometry> getGeometries();
}
