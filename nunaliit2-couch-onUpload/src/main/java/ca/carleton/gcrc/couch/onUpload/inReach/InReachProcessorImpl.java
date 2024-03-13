package ca.carleton.gcrc.couch.onUpload.inReach;

import java.io.StringWriter;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.TimeZone;
import java.util.Vector;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.time.ZoneId;

import org.json.JSONObject;
import org.json.JSONArray;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachFormField.Type;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.MultiPoint;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.geom.wkt.WktWriter;
import ca.carleton.gcrc.utils.DateUtils;

public class InReachProcessorImpl implements InReachProcessor {

	private InReachSettings settings = InReachConfiguration.getInReachSettings();
	private final String genericSchemaName = "inReach";
	private static HashMap<Integer, String> garminExploreMessageCodes = new HashMap<>();
	private static WktWriter wktWriter = new WktWriter();
	private DateTimeFormatter garminExploreMessageFormatter = DateTimeFormatter
			.ofPattern("uuuu-MM-dd'T'HH:mm:ss.nnnnnnnnnX").withZone(ZoneId.of("Z"));

	public InReachProcessorImpl() {
		garminExploreMessageCodes.put(0, "PositionReport");
		garminExploreMessageCodes.put(2, "LocateResponse");
		garminExploreMessageCodes.put(3, "FreeTextMessage");
		garminExploreMessageCodes.put(4, "DeclareSOS");
		garminExploreMessageCodes.put(6, "ConfirmSOS");
		garminExploreMessageCodes.put(7, "CancelSOS");
		garminExploreMessageCodes.put(8, "ReferencePoint");
		garminExploreMessageCodes.put(10, "StartTrack");
		garminExploreMessageCodes.put(11, "TrackInterval");
		garminExploreMessageCodes.put(12, "StopTrack");
		garminExploreMessageCodes.put(20, "MailCheck");
		garminExploreMessageCodes.put(21, "AmIAlive");
	}

	@Override
	public void performSubmission(FileConversionContext conversionContext) throws Exception {
		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		JSONObject doc = conversionContext.getDoc();

		if (null == doc) {
			throw new Exception("Unable to retrieve document while performing inReach submission");
		}

		JSONObject inReachItem = doc.optJSONObject("Item");
		JSONArray inReachEvents = doc.optJSONArray("Events");
		if (null != inReachItem) {
			processGeoProTypeMessage(conversionContext);
		} else if (null != inReachEvents) {
			processGarminExploreTypeMessage(conversionContext);
		} else {
			throw new Exception("Unknown inReach message type: " + docDescriptor.getDocId());
		}

	}

	public void processGeoProTypeMessage(FileConversionContext ctx) throws Exception {
		String schemaName = genericSchemaName;
		DocumentDescriptor docDescriptor = ctx.getDocument();
		JSONObject doc = ctx.getDoc();
		JSONObject jsonItem = doc.optJSONObject("Item");
		JSONObject genericInReachSchema = new JSONObject();
		JSONObject inReachPosition = new JSONObject();

		// Select form
		InReachForm form = null;
		if (null != jsonItem) {
			String message = jsonItem.optString("Message", null);
			if (null != message) {
				genericInReachSchema.put("Message", message);
				for (InReachForm testedForm : settings.getForms()) {
					String prefix = testedForm.getPrefix();
					if (null != prefix) {
						if (message.startsWith(prefix)) {
							form = testedForm;
						}
					}
				}
			}

			int emergencyState = jsonItem.optInt("EmergencyState", -12345);
			if (emergencyState != -12345) {
				genericInReachSchema.put("EmergencyState", emergencyState);
			}

			String deviceId = jsonItem.optString("DeviceId", null);
			if (deviceId != null) {
				genericInReachSchema.put("DeviceId", deviceId);
			}

			String messageId = jsonItem.optString("MessageId", null);
			if (messageId != null) {
				genericInReachSchema.put("MessageId", messageId);
			}

			String messageType = jsonItem.optString("MessageType", null);
			if (messageType != null) {
				genericInReachSchema.put("MessageType", messageType);
			}

			String recipients = jsonItem.optString("Recipients", null);
			if (recipients != null) {
				genericInReachSchema.put("Recipients", recipients);
			} else {
				JSONArray recipientsAsArray = jsonItem.optJSONArray("Recipients");
				if (recipientsAsArray != null) {
					genericInReachSchema.put("Recipients", recipientsAsArray);
				}
			}
		}

		// Convert geometry
		JSONObject jsonPosition = null;
		{
			docDescriptor.removeGeometryDescription();

			if (null != jsonItem) {
				jsonPosition = jsonItem.optJSONObject("Position");
			}

			if (null != jsonPosition) {
				double lat = jsonPosition.getDouble("Latitude");
				double lon = jsonPosition.getDouble("Longitude");

				GeometryDescriptor geomDesc = docDescriptor.getGeometryDescription();
				Geometry point = new Point(lon, lat);
				BoundingBox bbox = new BoundingBox(lon, lat, lon, lat);

				geomDesc.setGeometry(point);
				geomDesc.setBoundingBox(bbox);

				inReachPosition.put("Latitude", lat);
				inReachPosition.put("Longitude", lon);

			}
		}

		// Extract time
		if (null != jsonPosition) {
			String gpsTimestamp = jsonPosition.optString("GpsTimestamp", null);
			DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			df.setTimeZone(TimeZone.getTimeZone("UTC"));

			Date gpsDate = null;
			if (null != gpsTimestamp) {
				inReachPosition.put("GpsTimestamp", gpsTimestamp);
				genericInReachSchema.put("Position", inReachPosition);
				try {
					gpsDate = DateUtils.parseGpsTimestamp(gpsTimestamp);
				} catch (Exception e) {
					throw new Exception("Error while parsing GPS timestamp", e);
				}
			}

			// create date structure
			if (null != gpsDate) {
				// Round ms start interval timestamp to the nearest second
				long intervalStart = (gpsDate.getTime() + 500) / 1000;
				long intervalStart_ms = intervalStart * 1000;
				long intervalEnd = intervalStart_ms + 1000;

				Date gpsTimestampDate = new Date(intervalStart_ms);
				String formattedGpsTimestamp = df.format(gpsTimestampDate);

				JSONObject jsonDate = new JSONObject();
				jsonDate.put("nunaliit_type", "date");
				jsonDate.put("date", formattedGpsTimestamp);
				jsonDate.put("min", intervalStart_ms);
				jsonDate.put("max", intervalEnd);

				genericInReachSchema.put("nunaliit_gps_datetime", jsonDate);
			}
		}

		// Save generic information before processing form-specific inReach data
		doc.put(schemaName, genericInReachSchema);

		// Set schema
		if (null != form) {
			if (null != form.getTitle()) {
				schemaName = "inReach_" + form.getTitle();
			}
		}
		docDescriptor.setSchemaName(schemaName);

		// If a form is selected, extract information
		if (null != form) {
			try {
				extractInformationForForm(ctx.getDoc(), form);
			} catch (Exception e) {
				throw new Exception("Error while extracting information from the inReach data forms", e);
			}
		}

		ctx.saveDocument();
	}

	public void processGarminExploreTypeMessage(FileConversionContext ctx) throws Exception {
		String schemaName = genericSchemaName;
		DocumentDescriptor descriptor = ctx.getDocument();
		String docId = descriptor.getDocId();
		JSONObject doc = ctx.getDoc();
		JSONObject generatedDoc = null;
		JSONArray events = doc.optJSONArray("Events");
		String version = doc.optString("Version", null);
		JSONObject genericInReachSchema = null;
		JSONObject inReachPosition = null;
		InReachForm form = null;

		if (null == version) {
			throw new Exception("Garmin-type inReach message missing 'Version' key: " + docId);
		}

		if (version.equals("2.0")) {
			for (int i = 0; i < events.length(); i++) {
				form = null;
				schemaName = genericSchemaName;
				generatedDoc = new JSONObject();
				genericInReachSchema = new JSONObject();
				inReachPosition = new JSONObject();
				JSONObject event = events.getJSONObject(i);

				String freeText = event.optString("freeText", null);
				if (null != freeText) {
					genericInReachSchema.put("Message", freeText);
					for (InReachForm testedForm : settings.getForms()) {
						String prefix = testedForm.getPrefix();
						if (null != prefix) {
							if (freeText.startsWith(prefix)) {
								form = testedForm;
							}
						}
					}
				}

				Integer messageCode = event.optInt("messageCode", -12345);
				if (-12345 != messageCode) {
					if ((4 == messageCode) || (6 == messageCode) || (7 == messageCode)) {
						genericInReachSchema.put("EmergencyState", 1); // emergency-related
					} else {
						genericInReachSchema.put("EmergencyState", -1); // not emergency-related
					}

					String messageType = garminExploreMessageCodes.getOrDefault(messageCode, null);
					if (null == messageType) {
						genericInReachSchema.put("MessageType",
								"NunaliitUnhandledGarminExploreMessageCode-" + messageCode.toString());
					} else {
						genericInReachSchema.put("MessageType", messageType);
					}
				}

				String imei = event.optString("imei", null);
				if (null != imei) {
					genericInReachSchema.put("DeviceId", imei);
				}

				JSONObject msgPosition = event.optJSONObject("point");
				if (null != msgPosition) {
					double latitude = msgPosition.getDouble("latitude");
					double longitude = msgPosition.getDouble("longitude");
					inReachPosition.put("Latitude", latitude);
					inReachPosition.put("Longitude", longitude);

					Geometry location = new Point(longitude, latitude);
					BoundingBox box = location.getBoundingBox();
					JSONArray bbox = new JSONArray();
					bbox.put(box.getMinX());
					bbox.put(box.getMinY());
					bbox.put(box.getMaxX());
					bbox.put(box.getMaxY());
					StringWriter wkt = new StringWriter();
					wktWriter.write(location, wkt);

					JSONObject geom = new JSONObject();
					geom.put("nunaliit_type", "geometry");
					geom.put("wkt", wkt.toString());
					geom.put("bbox", bbox);
					generatedDoc.put("nunaliit_geom", geom);
				}

				Long timeStamp = event.optLong("timeStamp", -12345);
				Instant evTimestamp = Instant.ofEpochMilli(timeStamp);
				String isoTimestamp = garminExploreMessageFormatter.format(evTimestamp);
				DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
				df.setTimeZone(TimeZone.getTimeZone("UTC"));
				if (-12345 != timeStamp) {
					inReachPosition.put("GpsTimestamp", isoTimestamp);
					genericInReachSchema.put("Position", inReachPosition);
					// There is no MessageId equivalent, so use the timestamp
					genericInReachSchema.put("MessageId", timeStamp.toString());
				}

				Date gpsDate = null;
				try {
					gpsDate = DateUtils.parseGpsTimestamp(isoTimestamp);
				} catch (Exception e) {
					throw new Exception("Error while parsing GPS timestamp", e);
				}
				if (null != gpsDate) {
					long intervalStart = (gpsDate.getTime() + 500) / 1000;
					long intervalStart_ms = intervalStart * 1000;
					long intervalEnd = intervalStart_ms + 1000;

					Date gpsTimestampDate = new Date(intervalStart_ms);
					String formattedGpsTimestamp = df.format(gpsTimestampDate);

					JSONObject jsonDate = new JSONObject();
					jsonDate.put("nunaliit_type", "date");
					jsonDate.put("date", formattedGpsTimestamp);
					jsonDate.put("min", intervalStart_ms);
					jsonDate.put("max", intervalEnd);

					genericInReachSchema.put("nunaliit_gps_datetime", jsonDate);
				}

				JSONArray addresses = event.optJSONArray("addresses");
				if (null != addresses) {
					StringBuilder builder = new StringBuilder();
					String delimiter = "";
					for (int j = 0; j < addresses.length(); j++) {
						builder.append(delimiter);
						builder.append(addresses.getJSONObject(j).getString("address"));
						delimiter = ","; // Unknown what separated multiple recipients previously, assume comma for now
					}
					genericInReachSchema.put("Recipients", builder.toString());
				}

				generatedDoc.put(schemaName, genericInReachSchema);
				generatedDoc.put("nunaliit_created", descriptor.getCreatedObject());
				generatedDoc.put("nunaliit_last_updated", descriptor.getLastUpdatedObject());

				if (null != form) {
					if (null != form.getTitle()) {
						schemaName = schemaName + "_" + form.getTitle();
					}
					try {
						extractInformationForForm(generatedDoc, form);
					} catch (Exception e) {
						throw new Exception("Error while extracting information from the inReach data forms: ", e);
					}
				}

				generatedDoc.put("nunaliit_schema", schemaName);
				ctx.createDocument(generatedDoc);
			}

			// We will let this exist in the database, but set the schema to 'inReach' so it
			// stops looping work
			descriptor.setSchemaName(genericSchemaName);
			ctx.saveDocument();
		} else {
			throw new Exception("Unhandled version of GarminExplore type inReach message: " + docId);
		}
	}

	public void extractInformationForForm(
			JSONObject doc,
			InReachForm form) throws Exception {

		JSONObject jsonItem = doc.getJSONObject(genericSchemaName);
		String message = jsonItem.optString("Message", null);
		if (null == message) {
			throw new Exception("inReach data does not have 'Message' key");
		}
		if (false == message.startsWith(form.getPrefix())) {
			throw new Exception("Message should start with the form prefix");
		}
		String messageData = message.substring(form.getPrefix().length());

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
			for (InReachFormField field : form.getFields()) {
				if (first) {
					first = false;
				} else {
					sw.write(escapedDelimiter);
				}
				sw.write("(");

				InReachFormField.Type fieldType = field.getType();
				if (InReachFormField.Type.PICKLIST == fieldType) {
					sw.write("\\d*");
				} else if (InReachFormField.Type.TEXT == fieldType) {
					sw.write(".*");
				} else if (InReachFormField.Type.NUMBER == fieldType) {
					sw.write("\\d*");
				} else {
					throw new Exception("Unexpected type: " + fieldType);
				}

				sw.write(")");
			}
			sw.write("$");
			sw.flush();

			messagePattern = Pattern.compile(sw.toString(), Pattern.DOTALL);
		}

		// Parse message data using pattern
		Matcher messageMatcher = messagePattern.matcher(messageData);
		if (false == messageMatcher.matches()) {
			throw new Exception("Message data does not conform the expected pattern");
		}

		// Iterate over the fields, assigning values
		List<InReachFormField> fields = form.getFields();
		for (int i = 0, e = fields.size(); i < e; ++i) {
			InReachFormField field = fields.get(i);
			String data = messageMatcher.group(i + 1);

			String fieldName = field.getName();
			fieldName = escapeJsonAttribute(fieldName);

			String fieldDefaultValue = field.getDefault();

			Type fieldType = field.getType();
			if (InReachFormField.Type.PICKLIST == fieldType) {
				if ("".equals(data.trim()) && null != fieldDefaultValue) {
					// Not provided. But a default is provided. Use default.
					data = fieldDefaultValue;
				}

				if ("".equals(data.trim())) {
					// Not provided and no default: leave empty

				} else {
					int index = Integer.parseInt(data);
					index = index - 1; // 1-based index

					List<String> values = field.getValues();
					if (values.size() <= index) {
						throw new Exception("Index is out of bound for field " + fieldName + ": " + index);
					}

					String value = values.get(index);
					jsonData.put(fieldName, value);
				}

			} else if (InReachFormField.Type.TEXT == fieldType) {
				if ("".equals(data) && null != fieldDefaultValue) {
					jsonData.put(fieldName, fieldDefaultValue);
				} else {
					jsonData.put(fieldName, data);
				}

			} else if (InReachFormField.Type.NUMBER == fieldType) {
				if ("".equals(data.trim()) && null != fieldDefaultValue) {
					// Not provided. But a default is provided. Use default.
					data = fieldDefaultValue;
				}
				if ("".equals(data.trim())) {
					// Not provided and no default: leave empty

				} else {
					jsonData.put(fieldName, Integer.parseInt(data));
				}
			} else {
				throw new Exception("Unexpected type: " + fieldType);
			}
		}
	}

	public String regexEscape(String delimiter) {
		StringBuilder sb = new StringBuilder();

		for (char c : delimiter.toCharArray()) {
			if ('|' == c) {
				sb.append("\\|");
			} else {
				sb.append(c);
			}
		}

		return sb.toString();
	}

	public String escapeJsonAttribute(String fieldName) {
		StringBuilder sb = new StringBuilder();

		for (char c : fieldName.toCharArray()) {
			if (c >= '0' && c <= '9') {
				sb.append(c);
			} else if (c >= 'a' && c <= 'z') {
				sb.append(c);
			} else if (c >= 'A' && c <= 'Z') {
				sb.append(c);
			} else if (c == '_') {
				sb.append(c);
			} else {
				// skip
			}
		}

		return sb.toString();
	}
}
