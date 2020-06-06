package ca.carleton.gcrc.couch.onUpload.parser;

import ca.carleton.gcrc.couch.onUpload.geojson.GeoJsonFileConverter;
import ca.carleton.gcrc.couch.onUpload.gpx.GpxFileConverter;
import ca.carleton.gcrc.couch.onUpload.multimedia.MultimediaFileConverter;
import ca.carleton.gcrc.couch.onUpload.pdf.PdfFileConverter;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import org.apache.tika.mime.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.Properties;

/**
 * Factory class that determines which file converter to Currently, a bit of a hack to work around the current implementation.
 */
public class FileConverterFactory
{
	private static final Logger log = LoggerFactory.getLogger(FileConverterFactory.class);

	private PdfFileConverter pdfFileConverter;
	private MultimediaFileConverter multimediaFileConverter;
	private GpxFileConverter gpxFileConverter;
	private GeoJsonFileConverter geoJsonFileConverter;

	public FileConverterFactory(Properties uploadProperties) {
		pdfFileConverter = new PdfFileConverter(uploadProperties);
		multimediaFileConverter = new MultimediaFileConverter(uploadProperties);
		gpxFileConverter = new GpxFileConverter();
		geoJsonFileConverter = new GeoJsonFileConverter();
	}

	public FileConversionPlugin getFileConversionPlugin(String nunaliitFileClass) {
		FileConversionPlugin plugin = null;
		if ("audio".equalsIgnoreCase(nunaliitFileClass)
				|| "video".equalsIgnoreCase(nunaliitFileClass)
				|| "image".equalsIgnoreCase(nunaliitFileClass)) {
			plugin = multimediaFileConverter;
		}
		else if ("pdf".equalsIgnoreCase(nunaliitFileClass)) {
			plugin = pdfFileConverter;
		}
		else if ("geojson".equalsIgnoreCase(nunaliitFileClass)) {
			plugin = geoJsonFileConverter;
		}
		else if ("gpx".equalsIgnoreCase(nunaliitFileClass)) {
			plugin = gpxFileConverter;
		}

		return plugin;
	}

	public FileConversionPlugin getFileConversionPlugin(File file) {
		FileConversionPlugin plugin = null;
		MediaType mediaType = null;

		if (file != null) {
			mediaType = ContentTypeDetector.detectMimeType(file);
		}
		else {
			log.warn("File is null");
		}

		if (mediaType != null) {
			String type = mediaType.getType();
			String mimeType = mediaType.toString();

			if ("audio".equalsIgnoreCase(type)
					|| "video".equalsIgnoreCase(type)
					|| "image".equalsIgnoreCase(type)) {
				plugin = multimediaFileConverter;
			}
			else if ("application/pdf".equalsIgnoreCase(mimeType)) {
				plugin = pdfFileConverter;
			}
			else if ("application/json".equalsIgnoreCase(mimeType)) {
				if (ContentTypeDetector.isGeoJson(file)) {
					plugin = geoJsonFileConverter;
				}
			}
			else if ("application/xml".equalsIgnoreCase(mimeType)
					&& ContentTypeDetector.isGpx(file)) {
				plugin = gpxFileConverter;
			}
		}

		return plugin;
	}
}
