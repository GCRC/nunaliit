package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;

public class GeometrySimplifierImpl implements GeometrySimplifier {

	public GeometrySimplifierImpl() {
		
	}

	@Override
	public void simplyGeometry(FileConversionContext conversionContext) throws Exception {
		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		GeometryDescriptor geomDesc = docDescriptor.getGeometryDescription();
		
		// Do nothing. Simply set the simplified structure
		geomDesc.setSimplified( new JSONObject() );
		
		conversionContext.saveDocument();
	}
	
}
