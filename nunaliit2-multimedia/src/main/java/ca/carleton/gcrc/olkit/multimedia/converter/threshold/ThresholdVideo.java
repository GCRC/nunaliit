package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ThresholdVideo implements MultimediaConversionThreshold {

	protected static final Logger logger = LoggerFactory.getLogger(ThresholdVideo.class);

	private final String videoFormat;
	private final Long videoBitrate;
	private final String audioFormat;
	private final Long audioBitrate;
	private final Long width;
	private final Long height;
	private final Long maxFileSizeMb;

	public ThresholdVideo(String videoFormat, Long videoBitrate, String audioFormat, Long audioBitrate, Long width,
						  Long height, Long maxFileSizeMb) {
		this.videoFormat = videoFormat;
		this.videoBitrate = videoBitrate;
		this.audioFormat = audioFormat;
		this.audioBitrate = audioBitrate;
		this.width = width;
		this.height = height;
		this.maxFileSizeMb = maxFileSizeMb;
	}

	/**
	 * Parses a settings string in the format:
	 * <video-codec>,<max-video-bitrate>,<audio-codec>,<max-audio-bitrate>,<max-dimension>,<max-file-size>
	 *
	 * @param s The settings string to parse.
	 * @return The object representing video threshold settings.
	 */
	public static ThresholdVideo parseString(String s) {
		String videoFormat = null;
		Long videoBitrate = null;
		String audioFormat = null;
		Long audioBitrate = null;
		Long size = null;
		Long maxFileSize = null;
		
		String[] components = s.split(",");
		if (components.length != 6) {
			logger.error("Unable to parse image conversion threshold: {}", s);
			return null;
		}
		else {
			// video
			if (!"*".equals(components[0].trim())) {
				videoFormat = components[0].trim();
			}

			if (!"*".equals(components[1].trim())) {
				videoBitrate = Long.parseLong(components[1].trim());
			}

			// audio
			if (!"*".equals(components[2].trim())) {
				audioFormat = components[2].trim();
			}

			if (!"*".equals(components[3].trim())) {
				audioBitrate = Long.parseLong(components[3].trim());
			}

			// image
			if (!"*".equals(components[4].trim())) {
				size = Long.parseLong(components[4].trim());
			}

			// File size
			if (!"*".equals(components[5].trim())) {
				maxFileSize = Long.parseLong(components[5].trim());
			}
		}

		return new ThresholdVideo(videoFormat, videoBitrate, audioFormat, audioBitrate, size, size, maxFileSize);
	}

	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {

		if (this.videoFormat != null && !this.videoFormat.equalsIgnoreCase(videoFormat)) {
			return true;
		}

		if (this.videoBitrate != null && (videoRate == null || (videoRate > this.videoBitrate))) {
			return true;
		}

		if (this.audioFormat != null && !this.audioFormat.equalsIgnoreCase(audioFormat)) {
			return true;
		}

		if (this.audioBitrate != null && (audioRate == null || (audioRate > this.audioBitrate))) {
			return true;
		}

		if (this.maxFileSizeMb != null && fileSizeMb > maxFileSizeMb) {
			return true;
		}

		return isResizeRequired(imageWidth, imageHeight);
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {

		if (this.width != null && (null == imageWidth || (imageWidth > this.width))) {
			return true;
		}

		return this.height != null && (imageHeight == null || (imageHeight > this.height));
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("video(");

		if( null != videoFormat ) {
			pw.print( videoFormat );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != videoBitrate ) {
			pw.print( videoBitrate );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != audioFormat ) {
			pw.print( audioFormat );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != audioBitrate ) {
			pw.print( audioBitrate );
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
