package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;

public interface GeometrySimplifier {
	
	static final public String SIMPLIFIED_GEOMETRY_CONTENT_TYPE = "text/nunaliit2_geometry";

	void simplifyGeometry(FileConversionContext conversionContext) throws Exception;
}
