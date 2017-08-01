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
		InReachSettings settings = InReachConfiguration.getInReachSettings();

		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		
		JSONObject doc =  conversionContext.getDoc();

		JSONObject jsonItem = null;
		if( null != doc ){
			jsonItem = doc.optJSONObject("Item");
		}

		// Select form
		InReachForm form = null;
		if( null != jsonItem ){
			String message = jsonItem.optString("Message");
			if( null != message ){
				for(InReachForm testedForm : settings.getForms()){
					String prefix = testedForm.getPrefix();
					if( null != prefix ){
						if( message.startsWith(prefix) ){
							form = testedForm;
						}
					}
				}
			}
		}

		// Convert geometry
		{
			docDescriptor.removeGeometryDescription();

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
		String schemaName = "inReach";
		if( null != form ){
			if( null != form.getTitle() ){
				schemaName = "inReach_" + form.getTitle();
			}
		}
		docDescriptor.setSchemaName(schemaName);

		conversionContext.saveDocument();
	}

}
