package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ThresholdAudio implements MultimediaConversionThreshold {

	private static final Logger logger = LoggerFactory.getLogger(ThresholdAudio.class);

	private final String format;
	private final Long bitrate;
	private final Long maxFileSizeMb;

	public ThresholdAudio(String format, Long bitrate, Long maxFileSizeMb) {
		this.format = format;
		this.bitrate = bitrate;
		this.maxFileSizeMb = maxFileSizeMb;
	}

	/**
	 * Parses a settings string in the format:
	 * <audio-codec>,<max-audio-bitrate>,<max-file-size>
	 *
	 * @param s The settings string to parse.
	 * @return The object representing audio threshold settings.
	 */
	public static ThresholdAudio parseString(String s) {
		String[] components = s.split(",");
		if (3 == components.length) {
			String format = null;
			Long bitrate = null;
			Long maxFileSize = null;

			if (!"*".equals(components[0].trim())) {
				format = components[0].trim();
			}

			if (!"*".equals(components[1].trim())) {
				bitrate = Long.parseLong(components[1].trim());
			}

			// File size
			if (!"*".equals(components[2].trim())) {
				maxFileSize = Long.parseLong(components[2].trim());
			}

			return new ThresholdAudio(format, bitrate, maxFileSize);
		}
		else {
			logger.error("Unable to parse image conversion threshold: {}", s);
			return null;
		}
	}

	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {

		if (format != null && !format.equalsIgnoreCase(audioFormat)) {
			return true;
		}

		if (bitrate != null && (audioRate == null || (audioRate > bitrate))) {
			return true;
		}

		return this.maxFileSizeMb != null && fileSizeMb > maxFileSizeMb;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		return false;
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("audio(");

		if( null != format ) {
			pw.print( format );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != bitrate ) {
			pw.print( bitrate );
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
