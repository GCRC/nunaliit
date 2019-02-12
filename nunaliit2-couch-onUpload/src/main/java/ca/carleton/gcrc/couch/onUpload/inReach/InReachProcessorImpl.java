package ca.carleton.gcrc.couch.onUpload.inReach;

import java.io.StringWriter;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachFormField.Type;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.utils.DateUtils;

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
		JSONObject jsonPosition = null;
		{
			docDescriptor.removeGeometryDescription();

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

		// Extract time
		if( null != jsonPosition ) {
			String gpsTimestamp = jsonPosition.optString("GpsTimestamp", null);
			
			Date gpsDate = null;
			if( null != gpsTimestamp ) {
				try {
					gpsDate = DateUtils.parseGpsTimestamp(gpsTimestamp);
				} catch(Exception e) {
					throw new Exception("Error while parsing GPS timestamp", e);
				}
			}

			// create date structure
			if( null != gpsDate ) {
				long intervalStart = gpsDate.getTime() / 1000;
				long intervalEnd = intervalStart + 1;

				JSONObject jsonDate = new JSONObject();
				jsonDate.put("nunaliit_type", "date");
				jsonDate.put("date", gpsTimestamp);
				jsonDate.put("min", intervalStart);
				jsonDate.put("max", intervalEnd);

				jsonItem.put("NunaliitTimestamp", jsonDate);
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

		// If a form is selected, extract information
		if( null != form ){
			try {
				extractInformationForForm(conversionContext, form);
			} catch (Exception e) {
				throw new Exception("Error while extracting information from the inReach data forms", e);
			}
		}

		conversionContext.saveDocument();
	}

	public void extractInformationForForm(
			FileConversionContext conversionContext, 
			InReachForm form) throws Exception {

		JSONObject doc =  conversionContext.getDoc();

		JSONObject jsonItem = doc.getJSONObject("Item");
		String message = jsonItem.getString("Message");
		if( false == message.startsWith(form.getPrefix()) ){
			throw new Exception("Message should start with the form prefix");
		}
		String messageData = message.substring( form.getPrefix().length() );

		// Install data for conversion
		String attName = "inReach_" + form.getTitle();
		JSONObject jsonData = new JSONObject();
		doc.put(attName, jsonData);
		
		// Create a regular expression to parse the message
		Pattern messagePattern = null;
		{
			String escapedDelimiter = regexEscape(form.getDelimiter());
			
			StringWriter sw = new StringWriter();
			sw.write("^");
			boolean first = true;
			for(InReachFormField field : form.getFields()){
				if( first ){
					first = false;
				} else {
					sw.write(escapedDelimiter);
				}
				sw.write("(");
				
				InReachFormField.Type fieldType = field.getType();
				if( InReachFormField.Type.PICKLIST == fieldType ){
					sw.write("\\d*");
				} else if( InReachFormField.Type.TEXT == fieldType ) {
					sw.write(".*");
				} else {
					throw new Exception("Unexpected type: "+fieldType);
				}
				
				sw.write(")");
			}
			sw.write("$");
			sw.flush();
			
			messagePattern = Pattern.compile(sw.toString(),Pattern.DOTALL);
		}
		
		// Parse message data using pattern
		Matcher messageMatcher = messagePattern.matcher(messageData);
		if( false == messageMatcher.matches() ){
			throw new Exception("Message data does not conform the expected pattern");
		}
		
		// Iterate over the fields, assigning values
		List<InReachFormField> fields = form.getFields();
		for(int i=0,e=fields.size(); i<e; ++i){
			InReachFormField field = fields.get(i);
			String data = messageMatcher.group(i+1);
			
			String fieldName = field.getName();
			fieldName = escapeJsonAttribute(fieldName);

			String fieldDefaultValue = field.getDefault();

			Type fieldType = field.getType();
			if( InReachFormField.Type.PICKLIST == fieldType ){
				if( "".equals(data.trim()) && null != fieldDefaultValue ) {
					// Not provided. But a default is provided. Use default.
					data = fieldDefaultValue;
				}

				if( "".equals(data.trim()) ) {
					// Not provided and no default: leave empty

				} else {
					int index = Integer.parseInt(data);
					index = index - 1; // 1-based index
					
					List<String> values = field.getValues();
					if( values.size() <= index ){
						throw new Exception("Index is out of bound for field "+fieldName+": "+index);
					}
					
					String value = values.get(index);
					jsonData.put(fieldName, value);
				}
				
			} else if( InReachFormField.Type.TEXT == fieldType ) {
				if( "".equals(data) && null != fieldDefaultValue ){
					jsonData.put(fieldName, fieldDefaultValue);
				} else {
					jsonData.put(fieldName, data);
				}

			} else {
				throw new Exception("Unexpected type: "+fieldType);
			}
		}
	}

	public String regexEscape(String delimiter) {
		StringBuilder sb = new StringBuilder();
		
		for(char c : delimiter.toCharArray()){
			if( '|' == c ){
				sb.append("\\|");
			} else {
				sb.append(c);
			}
		}
		
		return sb.toString();
	}

	public String escapeJsonAttribute(String fieldName) {
		StringBuilder sb = new StringBuilder();
		
		for(char c : fieldName.toCharArray()){
			if( c >= '0' &&  c <= '9' ){
				sb.append(c);
			} else if( c >= 'a' &&  c <= 'z' ){
				sb.append(c);
			} else if( c >= 'A' &&  c <= 'Z' ){
				sb.append(c);
			} else if( c == '_' ){
				sb.append(c);
			} else {
				// skip
			}
		}
		
		return sb.toString();
	}
}
