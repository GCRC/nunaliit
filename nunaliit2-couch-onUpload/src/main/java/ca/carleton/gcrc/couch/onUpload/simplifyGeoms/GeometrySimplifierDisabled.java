package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;

public class GeometrySimplifierDisabled implements GeometrySimplifier {

	@Override
	public void simplifyGeometry(FileConversionContext conversionContext) throws Exception {
		// If we get here, it is because simplification is disabled but the work view continues
		// to report geometries that needs simplifications. Install a simplified object on
		// geometry to silence the view.
		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		GeometryDescriptor geomDesc = docDescriptor.getGeometryDescription();
		
		// Start simplified object
		JSONObject simplified = new JSONObject();
		geomDesc.setSimplified( simplified );
		
		conversionContext.saveDocument();
	}

}
