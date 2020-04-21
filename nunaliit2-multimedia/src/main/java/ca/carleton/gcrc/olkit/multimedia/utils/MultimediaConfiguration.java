package ca.carleton.gcrc.olkit.multimedia.utils;

import java.util.Enumeration;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.olkit.multimedia.converter.impl.MultimediaConverterImpl;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdAudio;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdImage;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdLogicalAnd;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdVideo;
import ca.carleton.gcrc.olkit.multimedia.ffmpeg.FFmpeg;
import ca.carleton.gcrc.olkit.multimedia.ffmpeg.FFmpegProcessorDefault;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageMagickProcessorDefault;

public class MultimediaConfiguration
{

	private MultimediaConfiguration() {
	}

	private static int imageMaxWidth = 1000;
	private static int imageMaxHeight = 1000;
	private static int imageThumbHeight = 350;
	private static int imageThumbWidth = 350;
	private static int videoThumbHeight = 240;
	private static int videoThumbWidth = 320;

	static final Logger logger = LoggerFactory.getLogger(MultimediaConfiguration.class);

	public static void configureFromProperties(Properties props) {
		// FFMpeg
		String ffmpegVersionCommand = props.getProperty("ffmpegVersionCommand", null);
		if (ffmpegVersionCommand != null) {
			FFmpeg.ffmpegVersionCommand = ffmpegVersionCommand;
		}

		String ffmpegInfoCommand = props.getProperty("ffmpegInfoCommand", null);
		if (ffmpegInfoCommand != null) {
			FFmpegProcessorDefault.ffmpegInfoCommand = ffmpegInfoCommand;
		}

		String ffmpegConvertVideoCommand = props.getProperty("ffmpegConvertVideoCommand", null);
		if (null != ffmpegConvertVideoCommand) {
			FFmpegProcessorDefault.ffmpegConvertVideoCommand = ffmpegConvertVideoCommand;
		}

		String ffmpegConvertAudioCommand = props.getProperty("ffmpegConvertAudioCommand", null);
		if (ffmpegConvertAudioCommand != null) {
			FFmpegProcessorDefault.ffmpegConvertAudioCommand = ffmpegConvertAudioCommand;
		}

		String ffmpegCreateThumbnailCommand = props.getProperty("ffmpegCreateThumbnailCommand", null);
		if (ffmpegCreateThumbnailCommand != null) {
			FFmpegProcessorDefault.ffmpegCreateThumbnailCommand = ffmpegCreateThumbnailCommand;
		}

		String secondsStr = props.getProperty("ffmpegCreateThumbnailFrameInSec", null);
		if (null != secondsStr) {
			try {
				double seconds = Double.parseDouble(secondsStr.trim());
				if (seconds < 0) {
					throw new Exception("Negative value: " + seconds);
				}

				FFmpegProcessorDefault.ffmpegCreateThumbnailFrameInSec = seconds;
			}
			catch (Exception e) {
				logger.error("Property 'ffmpegCreateThumbnailFrameInSec' should contain a positive number", e);
			}
		}

		// ImageMagick
		String imageInfoCommand = props.getProperty("imageInfoCommand", null);
		if (imageInfoCommand != null) {
			ImageMagickProcessorDefault.imageInfoCommand = imageInfoCommand;
		}

		String imageConvertCommand = props.getProperty("imageConvertCommand", null);
		if (imageConvertCommand != null) {
			ImageMagickProcessorDefault.imageConvertCommand = imageConvertCommand;
		}

		String imageResizeCommand = props.getProperty("imageResizeCommand", null);
		if (imageResizeCommand != null) {
			ImageMagickProcessorDefault.imageResizeCommand = imageResizeCommand;
		}

		String imageReorientCommand = props.getProperty("imageReorientCommand", null);
		if (imageReorientCommand != null) {
			ImageMagickProcessorDefault.imageReorientCommand = imageReorientCommand;
		}

		// Known MIME types
		String imageMimeTypes = props.getProperty("imageMimeTypes", null);
		if (imageMimeTypes != null) {
			String[] types = imageMimeTypes.split(":");
			for (String type : types) {
				MimeUtils.addKnownImageMimeType(type.trim());
			}
		}

		String audioMimeTypes = props.getProperty("audioMimeTypes", null);
		if (audioMimeTypes != null) {
			String[] types = audioMimeTypes.split(";");
			for (String type : types) {
				MimeUtils.addKnownAudioMimeType(type.trim());
			}
		}

		String videoMimeTypes = props.getProperty("videoMimeTypes", null);
		if (videoMimeTypes != null) {
			String[] types = videoMimeTypes.split(";");
			for (String type : types) {
				MimeUtils.addKnownVideoMimeType(type.trim());
			}
		}

		// Image and thumbnail sizes
		String imageMaxHeight = props.getProperty("imageMaxHeight", null);
		if (imageMaxHeight != null) {
			MultimediaConfiguration.imageMaxHeight = Integer.parseInt(imageMaxHeight);
		}

		String imageMaxWidth = props.getProperty("imageMaxWidth", null);
		if (imageMaxWidth != null) {
			MultimediaConfiguration.imageMaxWidth = Integer.parseInt(imageMaxWidth);
		}

		String thumbnailImageHeight = props.getProperty("thumbnailImageHeight", null);
		if (thumbnailImageHeight != null) {
			imageThumbHeight = Integer.parseInt(thumbnailImageHeight);
		}

		String thumbnailImageWidth = props.getProperty("thumbnailImageWidth", null);
		if (thumbnailImageWidth != null) {
			imageThumbWidth = Integer.parseInt(thumbnailImageWidth);
		}

		String thumbnailVideoHeight = props.getProperty("thumbnailVideoHeight", null);
		if (thumbnailVideoHeight != null) {
			videoThumbHeight = Integer.parseInt(thumbnailVideoHeight);
		}

		String thumbnailVideoWidth = props.getProperty("thumbnailVideoWidth", null);
		if (thumbnailVideoWidth != null) {
			videoThumbWidth = Integer.parseInt(thumbnailVideoWidth);
		}

		// Conversion thresholds
		String imageThresholdString = props.getProperty("multimedia.conversion.image.threshold", null);
		MultimediaConverterImpl.imageConversionThreshold = parseImageThreshold(imageThresholdString);
		logger.info("Image Conversion Threshold: {}", MultimediaConverterImpl.imageConversionThreshold);

		String audioThresholdString = props.getProperty("multimedia.conversion.audio.threshold", null);
		MultimediaConverterImpl.audioConversionThreshold = parseAudioThreshold(audioThresholdString);
		logger.info("Audio Conversion Threshold: {}", MultimediaConverterImpl.audioConversionThreshold);

		String videoThresholdString = props.getProperty("multimedia.conversion.video.threshold", null);
		MultimediaConverterImpl.videoConversionThreshold = parseVideoThreshold(videoThresholdString);
		logger.info("Video Conversion Threshold: {}", MultimediaConverterImpl.videoConversionThreshold);

		// File known strings
		Enumeration<?> it = props.propertyNames();
		while (it.hasMoreElements()) {
			Object propertyNameObj = it.nextElement();
			if (propertyNameObj instanceof String) {
				String propertyName = (String) propertyNameObj;
				if (propertyName.startsWith("file.knownString")) {
					String value = props.getProperty(propertyName);
					// The value should be in the form of <mime-type> : <known string>
					String[] parts = value.split(":");
					if (2 == parts.length) {
						SystemFile.addKnownString(parts[0], parts[1]);
					}
					else {
						logger.error("Can not interpret property: {}={}", propertyName, value);
					}
				}
			}
		}
	}

	/**
	 * Parses the image threshold property (multimedia.conversion.image.threshold). Example formats:
	 * - JPEG,500
	 * - jpeg,500|png,500|gif,500
	 *
	 * @param propertyValue The image threshold property to parse.
	 * @return Threshold configuration for images.
	 */
	public static ThresholdLogicalAnd parseImageThreshold(String propertyValue) {
		ThresholdLogicalAnd thresholdLogicalAnd = null;
		if (propertyValue != null && propertyValue.length() > 0) {
			thresholdLogicalAnd = new ThresholdLogicalAnd();

			String[] thresholdStrings = propertyValue.split("\\|");
			for (String thresholdString : thresholdStrings) {
				ThresholdImage threshold = ThresholdImage.parseString(thresholdString);
				thresholdLogicalAnd.addThreshold(threshold);
			}
		}

		return thresholdLogicalAnd;
	}

	/**
	 * Parses the audio threshold property (multimedia.conversion.audio.threshold). Example formats:
	 * - mpeg,250000
	 * - mpeg,250000|ogg,128000
	 *
	 * @param propertyValue The audio threshold property to parse.
	 * @return Threshold configuration for audio.
	 */
	public static ThresholdLogicalAnd parseAudioThreshold(String propertyValue) {
		ThresholdLogicalAnd thresholdLogicalAnd = null;
		if (propertyValue != null && propertyValue.length() > 0) {
			thresholdLogicalAnd = new ThresholdLogicalAnd();

			String[] thresholdStrings = propertyValue.split("\\|");
			for (String thresholdString : thresholdStrings) {
				ThresholdAudio threshold = ThresholdAudio.parseString(thresholdString);
				thresholdLogicalAnd.addThreshold(threshold);
			}
		}

		return thresholdLogicalAnd;
	}

	/**
	 * Parses the video threshold property (multimedia.conversion.video.threshold). Example formats:
	 * - h264,250000,mpeg4aac,250000,*
	 * - h264,250000,mpeg4aac,250000,*|mp4,250000,aac,250000,*
	 *
	 * @param propertyValue The video threshold property to parse.
	 * @return Threshold configuration for video.
	 */
	public static ThresholdLogicalAnd parseVideoThreshold(String propertyValue) {
		ThresholdLogicalAnd thresholdLogicalAnd = null;
		if (propertyValue != null && propertyValue.length() > 0) {
			thresholdLogicalAnd = new ThresholdLogicalAnd();

			String[] thresholdStrings = propertyValue.split("\\|");
			for (String thresholdString : thresholdStrings) {
				ThresholdVideo threshold = ThresholdVideo.parseString(thresholdString);
				thresholdLogicalAnd.addThreshold(threshold);
			}
		}

		return thresholdLogicalAnd;
	}

	public static int getImageMaxWidth() {
		return imageMaxWidth;
	}

	public static int getImageMaxHeight() {
		return imageMaxHeight;
	}

	public static int getImageThumbHeight() {
		return imageThumbHeight;
	}

	public static int getImageThumbWidth() {
		return imageThumbWidth;
	}

	public static int getVideoThumbHeight() {
		return videoThumbHeight;
	}

	public static int getVideoThumbWidth() {
		return videoThumbWidth;
	}
}
