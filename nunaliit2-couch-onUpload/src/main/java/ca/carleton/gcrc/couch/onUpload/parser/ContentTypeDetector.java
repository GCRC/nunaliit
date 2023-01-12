package ca.carleton.gcrc.couch.onUpload.parser;

import ca.carleton.gcrc.geom.geojson.GeoJsonParser;
import org.apache.tika.Tika;
import org.apache.tika.detect.XmlRootExtractor;
import org.apache.tika.mime.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.namespace.QName;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Utility to detect the mime type of files. Uses the Apache Tika library.
 */
public class ContentTypeDetector
{
	private static final Logger log = LoggerFactory.getLogger(ContentTypeDetector.class);

	private ContentTypeDetector() {
	}

	/**
	 * Nunaliit code depends on specific "file class" instead of mime types. This method returns the ones we support by
	 * examining the file. Possible Nunaliit "file classes" are image, video, audio, pdf, geojson, gpx.
	 *
	 * @param file File to determine Nunaliit file class.
	 * @return The Nunaliit custom file class.
	 */
	public static String detectNunaliitFileClass(File file) {
		String fileClass = "";
		MediaType mediaType = detectMimeType(file);

		// image, video, audio
		if (mediaType != null) {
			if (!mediaType.getType().equalsIgnoreCase("application")) {
				fileClass = mediaType.getType();
			}
			else if (mediaType.getSubtype().equalsIgnoreCase("xml") && isGpx(file)) {
				fileClass = "gpx";
			}
			else if (mediaType.getSubtype().equalsIgnoreCase("json") && isGeoJson(file)) {
				fileClass = "geojson";
			}
			else if (mediaType.getSubtype().equalsIgnoreCase("pdf")) {
				fileClass = "pdf";
			}
		}

		return fileClass;
	}

	/**
	 * Determine the mime type of given file.
	 *
	 * @param file The file to detect mime type of.
	 * @return The mime type of the file, or null if it was undetermined.
	 */
	public static MediaType detectMimeType(File file) {
		MediaType mediaType = null;
		if (file != null) {

			try {
				Tika tika = new Tika();
				mediaType = MediaType.parse(tika.detect(file.getName()));

				log.debug("File {} has mime type {}", file.getName(), mediaType);
			}
			catch ( Exception e) {
				log.warn("Problem detecting file type: {}", e.getMessage());
			}
		}
		else {
			log.warn("File is null, cannot determine mime type");
		}

		return mediaType;
	}

	/**
	 * Determines if a file is a GPX file, which is an XML file with root element "gpx".
	 *
	 * @param file The file to examine.
	 * @return True if the given file is a GPX XML file, otherwise false.
	 */
	public static boolean isGpx(File file) {
		boolean isGpx = false;

		XmlRootExtractor rootExtractor = new XmlRootExtractor();
		QName qName;
		try {
			qName = rootExtractor.extractRootElement(new FileInputStream(file));
			isGpx = "gpx".equalsIgnoreCase(qName.getLocalPart());
		}
		catch (FileNotFoundException e) {
			log.warn("Problem parsing file for XML root element, possibly not an XML file: {}. Error: {}", file.getName(), e.getMessage());
		}

		return isGpx;
	}

	/**
	 * Determines if a file is a GeoJson file, which is an JSON file that can be parsed with the {@link GeoJsonParser}.
	 *
	 * @param file The file to examine.
	 * @return True if the given file is a geo json file, otherwise false.
	 */
	public static boolean isGeoJson(File file) {
		boolean isGeoJson = false;
		try (FileInputStream fis = new FileInputStream(file);
			 InputStreamReader reader = new InputStreamReader(fis, StandardCharsets.UTF_8)) {
			GeoJsonParser parser = new GeoJsonParser();
			try {
				parser.parse(reader);
				isGeoJson = true;
			}
			catch (Exception e) {
				// Ignore - not a geo json file.
			}
		}
		catch (FileNotFoundException e) {
			log.error("File not found", e);
		}
		catch (IOException e) {
			log.error("Error reading file", e);
		}

		return isGeoJson;
	}
}
