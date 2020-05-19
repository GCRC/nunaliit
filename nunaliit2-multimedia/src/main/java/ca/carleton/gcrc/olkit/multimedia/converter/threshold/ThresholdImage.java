package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ThresholdImage implements MultimediaConversionThreshold {

	private static final Logger logger = LoggerFactory.getLogger(ThresholdImage.class);

	private final String format;
	private final Long width;
	private final Long height;
	private final Long maxFileSizeMb;

	public ThresholdImage(String format, Long width, Long height, Long maxFileSizeMb) {
		this.format = format;
		this.width = width;
		this.height = height;
		this.maxFileSizeMb = maxFileSizeMb;
	}

	/**
	 * Parses a settings string in the format:
	 * <image-format>,<max-dimension>,<max-file-size>
	 *
	 * @param s The settings string to parse.
	 * @return The object representing image threshold settings.
	 */
	public static ThresholdImage parseString(String s) {
		String[] components = s.split(",");
		if (components.length == 3) {
			String format = null;
			Long size = null;
			Long maxFileSize = null;

			if (!"*".equals(components[0].trim())) {
				format = components[0].trim();
			}

			if (!"*".equals(components[1].trim())) {
				size = Long.parseLong(components[1].trim());
			}

			// File size
			if (!"*".equals(components[2].trim())) {
				maxFileSize = Long.parseLong(components[2].trim());
			}

			return new ThresholdImage(format, size, size, maxFileSize);

		}
		else {
			logger.error("Unable to parse image conversion threshold: {}", s);
			return null;
		}
	}
	
	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {

		if( isResizeRequired(imageWidth,imageHeight) ) {
			return true;
		}

		if (format != null && !format.equalsIgnoreCase(videoFormat)) {
			return true;
		}

		return this.maxFileSizeMb != null && fileSizeMb > maxFileSizeMb;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {

		if (width != null && (imageWidth == null || (imageWidth > width))) {
			return true;
		}

		return height != null && (imageHeight == null || (imageHeight > height));
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("image(");

		if( null != format ) {
			pw.print( format );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != width ) {
			pw.print( width );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != height ) {
			pw.print( height );
		} else {
			pw.print( "*" );
		}

		pw.print(",");

		if (maxFileSizeMb != null) {
			pw.println(maxFileSizeMb);
		}
		else {
			pw.print("*");
		}

		pw.print(")");
		
		pw.flush();
		
		return sw.toString();
	}
}
