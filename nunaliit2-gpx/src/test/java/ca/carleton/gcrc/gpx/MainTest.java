package ca.carleton.gcrc.gpx;

import java.io.File;
import java.net.URL;

import junit.framework.TestCase;

public class MainTest extends TestCase {

	static public File getTestFile(String resourceName) {
		URL url = MainTest.class.getClassLoader().getResource(resourceName);
		return new File(url.getFile());
	}
	
	static public void loadFileTest(File testFile) throws Exception {

		GpxFactory gpxFactory = new GpxFactory();
		Gpx result = gpxFactory.loadFromFile(testFile);
		if( null == result ) {
			fail("Unable to load GPX: "+testFile.getAbsolutePath());
		}
		
	}

	public void testLoad1() throws Exception {
		File testFile = getTestFile("fells_loop.gpx");
		loadFileTest(testFile);
	}

	public void testLoad2() throws Exception {
		File testFile = getTestFile("BogusBasin.gpx");
		loadFileTest(testFile);
	}

	public void testLoad3() throws Exception {
		File testFile = getTestFile("BoiseFront.gpx");
		loadFileTest(testFile);
	}

	public void testLoad4() throws Exception {
		File testFile = getTestFile("clementine_loop.gpx");
		loadFileTest(testFile);
	}
}
