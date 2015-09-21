package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import ca.carleton.gcrc.geom.Geometry;

public interface GeometrySimplificationProcess {

	GeometrySimplificationReport simplifyGeometry(Geometry geometry) throws Exception;
}
