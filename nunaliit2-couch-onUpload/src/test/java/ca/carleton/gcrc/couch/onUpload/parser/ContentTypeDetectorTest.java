package ca.carleton.gcrc.couch.onUpload.parser;

import junit.framework.TestCase;

import java.io.File;
import java.net.URISyntaxException;

public class ContentTypeDetectorTest extends TestCase
{
	public void testIsGpx_False() throws URISyntaxException {
		File gpx = new File(ContentTypeDetectorTest.class.getClassLoader().getResource("inreach_forms.xml").toURI());

		assertFalse(ContentTypeDetector.isGpx(gpx));
	}

	public void testIsGpx_True() throws URISyntaxException {
		File gpx = new File(ContentTypeDetectorTest.class.getClassLoader().getResource("gpx-sample.gpx").toURI());

		assertTrue(ContentTypeDetector.isGpx(gpx));
	}

	public void testIsGeoJson_False() throws URISyntaxException {
		File geoJson = new File(ContentTypeDetectorTest.class.getClassLoader().getResource("schema.json").toURI());

		assertFalse(ContentTypeDetector.isGeoJson(geoJson));
	}

	public void testIsGeoJson_True() throws URISyntaxException {
		File geoJson = new File(ContentTypeDetectorTest.class.getClassLoader().getResource("large.json").toURI());

		assertTrue(ContentTypeDetector.isGeoJson(geoJson));
	}
}