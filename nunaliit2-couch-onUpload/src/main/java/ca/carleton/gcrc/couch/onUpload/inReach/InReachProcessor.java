package ca.carleton.gcrc.couch.onUpload.inReach;

import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;

public interface InReachProcessor {

	void performSubmission(FileConversionContext conversionContext) throws Exception;
}
