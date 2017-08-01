package ca.carleton.gcrc.couch.onUpload.inReach;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.Point;

public class InReachProcessorImpl implements InReachProcessor {

	@Override
	public void performSubmission(FileConversionContext conversionContext) throws Exception {
		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		
		JSONObject doc =  conversionContext.getDoc();

		// Convert geometry
		{
			JSONObject jsonItem = null;
			if( null != doc ){
				jsonItem = doc.optJSONObject("Item");
			}
			
			JSONObject jsonPosition = null;
			if( null != jsonItem ){
				jsonPosition = jsonItem.optJSONObject("Position");
			}
			
			if( null != jsonPosition ){
				double lat = jsonPosition.getDouble("Latitude");
				double lon = jsonPosition.getDouble("Longitude");

				GeometryDescriptor geomDesc = docDescriptor.getGeometryDescription();
				
				Geometry point = new Point(lon,lat);
				BoundingBox bbox = new BoundingBox(lon, lat, lon, lat);
				
				geomDesc.setGeometry(point);
				geomDesc.setBoundingBox(bbox);
			}
		}

		// Set schema
		docDescriptor.setSchemaName("inReach");

		conversionContext.saveDocument();
	}

}
