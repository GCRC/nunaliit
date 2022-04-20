package ca.carleton.gcrc.couch.onUpload.parser;

import ca.carleton.gcrc.geom.geojson.GeoJsonParser;
import org.apache.tika.config.TikaConfig;
import org.apache.tika.detect.XmlRootExtractor;
import org.apache.tika.exception.TikaException;
import org.apache.tika.io.TikaInputStream;
import org.apache.tika.metadata.Metadata;
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
			TikaConfig tika;
			Metadata metadata = new Metadata();
			metadata.set(Metadata.RESOURCE_NAME_KEY, file.getName());
			TikaInputStream tis = null;
			try {
				tika = new TikaConfig();
				tis = TikaInputStream.get(file.toURI());
				mediaType = tika.getDetector().detect(tis, metadata);
				log.debug("File {} has mime type {}", file.getName(), mediaType);
			}
			catch (TikaException | IOException e) {
				log.warn("Problem detecting file type: {}", e.getMessage());
			}
			if(tis != null) {
				try {
					tis.close();
				} catch (IOException e) {
					log.debug("Unable to close TikaInputStream", e);
				}
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
		FileInputStream fis = null;
		try {
			fis = new FileInputStream(file);
			qName = rootExtractor.extractRootElement(fis);
			isGpx = "gpx".equalsIgnoreCase(qName.getLocalPart());		}
		catch (FileNotFoundException e) {
			log.warn("Problem parsing file for XML root element, possibly not an XML file: {}. Error: {}", file.getName(), e.getMessage());
		}

		if(fis != null) {
			try {
				fis.close();
			} catch (IOException e) {
				log.debug("Unable to close GPX FileInputStream", e);
			}
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
		FileInputStream fis = null;
		InputStreamReader reader = null;

		try {
			fis = new FileInputStream(file);
			reader = new InputStreamReader(fis, StandardCharsets.UTF_8);
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

		try {
			if(reader != null) {
				reader.close();
			} 
			if(fis != null) {
				fis.close();
			}
		} catch (IOException e) {
			log.debug("Unable to close file handle for geo file check", e);
		}

		return isGeoJson;
	}
}
