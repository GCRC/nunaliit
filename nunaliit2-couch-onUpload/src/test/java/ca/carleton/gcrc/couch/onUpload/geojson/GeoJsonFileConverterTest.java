package ca.carleton.gcrc.couch.onUpload.geojson;

import java.io.File;
import java.io.StringReader;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.onUpload.TestSupport;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import junit.framework.TestCase;

public class GeoJsonFileConverterTest extends TestCase {

	public void testApproveFile() throws Exception {
		if( TestSupport.isCouchDbTestingAvailable() ) {
			GeoJsonFileConverter converter = new GeoJsonFileConverter();
			
			File mediaDir = TestSupport.findTopTestingDir();
			CouchDb db = TestSupport.getTestCouchDb();
			CouchDesignDocument dd = db.getDesignDocument("atlas");
			String fileName = "large.json";
			
			String user = TestSupport.getUserName();
			
			JSONObject jsonDoc = null;
			{
				String jsonString = "{"
					+ "\"nunaliit_attachments\":{"
						+ "\"nunaliit_type\":\"attachment_descriptions\""
						+ ",\"files\":{"
							+ "\"file.json\":{"
								+"\"attachmentName\":\"file.json\""
								+",\"originalName\":\"file.json\""
								+",\"mediaFile\":\"" + fileName + "\""
								+",\"fileClass\":\"geojson\""
								+",\"mimeType\":\"application/json\""
								+",\"status\":\"approved\""
								+",\"submitter\":\"" + user + "\""
								+",\"size\":773"
								+",\"data\":{}"
								+",\"original\":{"
									+"\"mediaFile\":\"" + fileName + "\""
									+",\"mimeType\":\"application/json\""
									+",\"size\":773"
								+"}"
							+ "}"
						+ "}"	
					+ "}"
					+ ",\"nunaliit_created\":{"
						+ "\"nunaliit_type\":\"actionstamp\""
						+ ",\"name\":\"" + user + "\""
						+ ",\"action\":\"created\""
						+ ",\"time\":1347282712214"
					+ "}"
					+ ",\"nunaliit_last_updated\":{"
						+ "\"nunaliit_type\":\"actionstamp\""
						+ ",\"name\":\"" + user + "\""
						+ ",\"action\":\"updated\""
						+ ",\"time\":1347282712214"
					+ "}"
				+ "}";
				StringReader sr = new StringReader(jsonString);
				JSONTokener tokener = new JSONTokener(sr);
				Object obj = tokener.nextValue();
				if( obj instanceof JSONObject ){
					jsonDoc = (JSONObject)obj;
				}
				
				if( null == jsonDoc ) {
					throw new Exception("Test case broken. Unable to create JSON document");
				}
			}
			
			JSONObject info = db.createDocument(jsonDoc);
			String id = info.getString("id");
			JSONObject doc = db.getDocument(id);
			
			FileConversionContext approvedContext = new FileConversionContext(
				doc
				,dd
				,"file.json"
				,mediaDir
				);
			
			converter.approveFile(approvedContext);
		}
	}
}
