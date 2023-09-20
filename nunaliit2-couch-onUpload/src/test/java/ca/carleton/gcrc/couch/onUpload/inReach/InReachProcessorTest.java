package ca.carleton.gcrc.couch.onUpload.inReach;

import java.io.File;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.MockFileConversionContext2;
import ca.carleton.gcrc.couch.onUpload.TestSupport;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.Point;
import ca.carleton.gcrc.utils.TextFileUtils;
import junit.framework.TestCase;

public class InReachProcessorTest extends TestCase {

	public void testPerformSubmission() throws Exception {
		File settingsFile = TestSupport.findResourceFile("inreach_forms.xml");
		File docFile = TestSupport.findResourceFile("inreach_doc.json");
		
		InReachSettingsFromXmlFile settings = new InReachSettingsFromXmlFile(settingsFile);
		settings.load();
		InReachConfiguration.setInReachSettings(settings);
		
		InReachProcessorImpl processor = new InReachProcessorImpl();
		
		JSONObject jsonDoc = TextFileUtils.readJsonObjectFile(docFile);
		
		MockFileConversionContext2 conversionContext = new MockFileConversionContext2(jsonDoc);
		
		processor.performSubmission(conversionContext);
		
		JSONObject savedDocJson = conversionContext.getSavedDocument();
		if( null == savedDocJson ){
			fail("Document not saved");
		}
		MockFileConversionContext2 savedContext = new MockFileConversionContext2(savedDocJson);
		DocumentDescriptor savedDoc = savedContext.getDocument();
		
		// Test geometry
		GeometryDescriptor savedGeomDesc = savedDoc.getGeometryDescription();
		Geometry savedGeom = savedGeomDesc.getGeometry();
		
		if( savedGeom instanceof Point ){
			Point point = (Point)savedGeom;
			if( point.getX() < -75.65 
			 || point.getX() > -75.55 ){
				fail("Point Longitude should be -75.6: "+point.getX());
			}
			if( point.getY() < 45.25 
			 || point.getY() > 45.35 ){
				fail("Point Latitude should be 45.3: "+point.getY());
			}
		} else {
			fail("Geometry should be a Point");
		}
		
		// Test schema name
		String schemaName = savedDoc.getSchemaName();
		if( false == "inReach_Conditions".equals(schemaName) ){
			fail("Unexpected schema name: "+schemaName);
		}
		
		// Check data
		JSONObject data = savedDocJson.getJSONObject("inReach_Conditions");
		String condition = data.optString("Condition", null);
		if( false == "high water".equals(condition) ){
			fail("Unexpected data");
		}
	}

	public void testMissingField() throws Exception {
		File settingsFile = TestSupport.findResourceFile("inreach_forms.xml");
		File docFile = TestSupport.findResourceFile("inreach_doc_missing.json");
		
		InReachSettingsFromXmlFile settings = new InReachSettingsFromXmlFile(settingsFile);
		settings.load();
		InReachConfiguration.setInReachSettings(settings);
		
		InReachProcessorImpl processor = new InReachProcessorImpl();
		
		JSONObject jsonDoc = TextFileUtils.readJsonObjectFile(docFile);
		
		MockFileConversionContext2 conversionContext = new MockFileConversionContext2(jsonDoc);
		
		processor.performSubmission(conversionContext);
		
		JSONObject savedDocJson = conversionContext.getSavedDocument();
		if( null == savedDocJson ){
			fail("Document not saved");
		}
		MockFileConversionContext2 savedContext = new MockFileConversionContext2(savedDocJson);
		DocumentDescriptor savedDoc = savedContext.getDocument();
		
		// Test schema name
		String schemaName = savedDoc.getSchemaName();
		if( false == "inReach_Conditions".equals(schemaName) ){
			fail("Unexpected schema name: "+schemaName);
		}
		
		// Check data
		JSONObject data = savedDocJson.getJSONObject("inReach_Conditions");
		{
			String condition = data.optString("Condition", null);
			if( false == "other (put in notes)".equals(condition) ){
				fail("Unexpected data for 'Condition'");
			}
		}
		{
			String probs = data.optString("Causing problems?",null);
			if( null != probs ){
				fail("Unexpected data for 'Causing problems?'");
			}
		}
	}

	public void testGpsTimestamp() throws Exception {
		File settingsFile = TestSupport.findResourceFile("inreach_forms.xml");
		File docFile = TestSupport.findResourceFile("inreach_doc_missing.json");
		
		InReachSettingsFromXmlFile settings = new InReachSettingsFromXmlFile(settingsFile);
		settings.load();
		InReachConfiguration.setInReachSettings(settings);
		
		InReachProcessorImpl processor = new InReachProcessorImpl();
		
		JSONObject jsonDoc = TextFileUtils.readJsonObjectFile(docFile);
		
		MockFileConversionContext2 conversionContext = new MockFileConversionContext2(jsonDoc);
		
		processor.performSubmission(conversionContext);
		
		JSONObject savedDocJson = conversionContext.getSavedDocument();
		if( null == savedDocJson ){
			fail("Document not saved");
		}

		// Look for time structure
		JSONObject jsonItem = savedDocJson.getJSONObject("inReach");
		JSONObject jsonTimestamp = jsonItem.optJSONObject("nunaliit_gps_datetime");
		if( null == jsonTimestamp ){
			fail("Can not find nunaliit_gps_datetime!");
		} else {
			String dateType = jsonTimestamp.optString("nunaliit_type", null);
			if( false == "date".equals(dateType) ) {
				fail("Unexpected time structure");
			}
		}
	}
}
