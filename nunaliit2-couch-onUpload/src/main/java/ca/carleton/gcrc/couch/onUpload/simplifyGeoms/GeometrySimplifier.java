package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;

public interface GeometrySimplifier {

	void simplyGeometry(FileConversionContext conversionContext) throws Exception;
}
