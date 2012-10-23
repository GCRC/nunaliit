package ca.carleton.gcrc.olkit.multimedia.utils;

import java.util.Properties;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.olkit.multimedia.converter.impl.MultimediaConverterImpl;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdAudio;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdImage;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdLogicalAnd;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdVideo;
import ca.carleton.gcrc.olkit.multimedia.ffmpeg.FFmpegProcessorDefault;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageMagickProcessorDefault;

public class MultimediaConfiguration {

	static final Logger logger = Logger.getLogger(MultimediaConfiguration.class);
	
	static public void configureFromProperties(Properties props) {
		// FFMpeg
		{
			String command = props.getProperty("ffmpegInfoCommand", null);
			if( null != command ) {
				FFmpegProcessorDefault.ffmpegInfoCommand = command;
			}
		}
		{
			String command = props.getProperty("ffmpegConvertVideoCommand", null);
			if( null != command ) {
				FFmpegProcessorDefault.ffmpegConvertVideoCommand = command;
			}
		}
		{
			String command = props.getProperty("ffmpegConvertAudioCommand", null);
			if( null != command ) {
				FFmpegProcessorDefault.ffmpegConvertAudioCommand = command;
			}
		}
		{
			String command = props.getProperty("ffmpegCreateThumbnailCommand", null);
			if( null != command ) {
				FFmpegProcessorDefault.ffmpegCreateThumbnailCommand = command;
			}
		}

		// ImageMagick
		{
			String command = props.getProperty("imageInfoCommand", null);
			if( null != command ) {
				ImageMagickProcessorDefault.imageInfoCommand = command;
			}
		}
		{
			String command = props.getProperty("imageConvertCommand", null);
			if( null != command ) {
				ImageMagickProcessorDefault.imageConvertCommand = command;
			}
		}
		{
			String command = props.getProperty("imageResizeCommand", null);
			if( null != command ) {
				ImageMagickProcessorDefault.imageResizeCommand = command;
			}
		}
		{
			String command = props.getProperty("imageReorientCommand", null);
			if( null != command ) {
				ImageMagickProcessorDefault.imageReorientCommand = command;
			}
		}

		// Known MIME types
		{
			String typeString = props.getProperty("imageMimeTypes", null);
			if( null != typeString ) {
				String[] types = typeString.split(":");
				for(String type : types) {
					MimeUtils.addKnownImageMimeType(type.trim());
				}
			}
		}
		{
			String typeString = props.getProperty("audioMimeTypes", null);
			if( null != typeString ) {
				String[] types = typeString.split(";");
				for(String type : types) {
					MimeUtils.addKnownAudioMimeType(type.trim());
				}
			}
		}
		{
			String typeString = props.getProperty("videoMimeTypes", null);
			if( null != typeString ) {
				String[] types = typeString.split(";");
				for(String type : types) {
					MimeUtils.addKnownVideoMimeType(type.trim());
				}
			}
		}
		
		// Image and thumbnail sizes
		{
			String sizeString = props.getProperty("imageMaxHeight", null);
			if( null != sizeString ) {
				int size = Integer.parseInt(sizeString);
				MultimediaConverterImpl.IMAGE_MAX_HEIGHT = size;
			}
		}
		{
			String sizeString = props.getProperty("imageMaxWidth", null);
			if( null != sizeString ) {
				int size = Integer.parseInt(sizeString);
				MultimediaConverterImpl.IMAGE_MAX_WIDTH = size;
			}
		}
		{
			String sizeString = props.getProperty("thumbnailImageHeight", null);
			if( null != sizeString ) {
				int size = Integer.parseInt(sizeString);
				MultimediaConverterImpl.IMAGE_THUMB_HEIGHT = size;
			}
		}
		{
			String sizeString = props.getProperty("thumbnailImageWidth", null);
			if( null != sizeString ) {
				int size = Integer.parseInt(sizeString);
				MultimediaConverterImpl.IMAGE_THUMB_WIDTH = size;
			}
		}
		{
			String sizeString = props.getProperty("thumbnailVideoHeight", null);
			if( null != sizeString ) {
				int size = Integer.parseInt(sizeString);
				MultimediaConverterImpl.VIDEO_THUMB_HEIGHT = size;
			}
		}
		{
			String sizeString = props.getProperty("thumbnailVideoWidth", null);
			if( null != sizeString ) {
				int size = Integer.parseInt(sizeString);
				MultimediaConverterImpl.VIDEO_THUMB_WIDTH = size;
			}
		}
		
		// Conversion thresholds
		{
			String logicalThresholdString = props.getProperty("multimedia.conversion.image.threshold", null);
			if( null != logicalThresholdString ) {
				ThresholdLogicalAnd and = new ThresholdLogicalAnd();
				
				String[] thresholdStrings = logicalThresholdString.split("\\|");
				for(String thresholdString : thresholdStrings) {
					ThresholdImage threshold = ThresholdImage.parseString(thresholdString);
					and.addThreshold(threshold);
				}
				
				MultimediaConverterImpl.imageConversionThreshold = and;
				
				logger.info("Image Conversion Threshold: "+MultimediaConverterImpl.imageConversionThreshold);
			}
		}
		{
			String logicalThresholdString = props.getProperty("multimedia.conversion.audio.threshold", null);
			if( null != logicalThresholdString ) {
				ThresholdLogicalAnd and = new ThresholdLogicalAnd();
				
				String[] thresholdStrings = logicalThresholdString.split("\\|");
				for(String thresholdString : thresholdStrings) {
					ThresholdAudio threshold = ThresholdAudio.parseString(thresholdString);
					and.addThreshold(threshold);
				}
				
				MultimediaConverterImpl.audioConversionThreshold = and;
				
				logger.info("Audio Conversion Threshold: "+MultimediaConverterImpl.audioConversionThreshold);
			}
		}
		{
			String logicalThresholdString = props.getProperty("multimedia.conversion.video.threshold", null);
			if( null != logicalThresholdString ) {
				ThresholdLogicalAnd and = new ThresholdLogicalAnd();
				
				String[] thresholdStrings = logicalThresholdString.split("\\|");
				for(String thresholdString : thresholdStrings) {
					ThresholdVideo threshold = ThresholdVideo.parseString(thresholdString);
					and.addThreshold(threshold);
				}
				
				MultimediaConverterImpl.videoConversionThreshold = and;
				
				logger.info("Video Conversion Threshold: "+MultimediaConverterImpl.videoConversionThreshold);
			}
		}
	}
}
