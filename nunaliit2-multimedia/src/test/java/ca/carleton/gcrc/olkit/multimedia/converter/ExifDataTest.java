package ca.carleton.gcrc.olkit.multimedia.converter;


import junit.framework.TestCase;
import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;

public class ExifDataTest extends TestCase {

	public void testGetLongLat() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ExifData exifData = new ExifData();
		
		if( exifData.containsLongLat() ){
			fail("Shoud not contain long/lat");
		}
		
		exifData.addRawData("GPSLatitude", "45/1, 2100/100, 2700/100");
		exifData.addRawData("GPSLatitudeRef", "N");
		exifData.addRawData("GPSLongitude", "75/1, 4200/100, 54/1");
		exifData.addRawData("GPSLongitudeRef", "W");
		
		if( false == exifData.containsLongLat() ){
			fail("Shoud contain long/lat");
		}
		
		double expectedLat = 45.3575;
		if( expectedLat != exifData.computeLat() ){
			fail("Unexpected latitidue: "+exifData.computeLat());
		}
		
		double expectedLong = -75.715;
		if( expectedLong != exifData.computeLong() ){
			fail("Unexpected longitude: "+exifData.computeLong());
		}
	}
}
