package ca.carleton.gcrc.olkit.multimedia.converter.impl;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionRequest;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConverter;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.DefaultThresholdAudio;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.DefaultThresholdImage;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.DefaultThresholdVideo;
import ca.carleton.gcrc.olkit.multimedia.ffmpeg.FFmpeg;
import ca.carleton.gcrc.olkit.multimedia.ffmpeg.FFmpegMediaInfo;
import ca.carleton.gcrc.olkit.multimedia.ffmpeg.FFmpegProcessor;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageInfo;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageMagick;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageMagickInfo;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageMagickProcessor;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaConfiguration;
import ca.carleton.gcrc.olkit.multimedia.xmp.XmpExtractor;
import ca.carleton.gcrc.olkit.multimedia.xmp.XmpInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;

public class MultimediaConverterImpl implements MultimediaConverter {

	public static MultimediaConversionThreshold imageConversionThreshold = new DefaultThresholdImage();
	public static MultimediaConversionThreshold audioConversionThreshold = new DefaultThresholdAudio();
	public static MultimediaConversionThreshold videoConversionThreshold = new DefaultThresholdVideo();

	private static final Logger logger = LoggerFactory.getLogger(MultimediaConverterImpl.class);

	@Override
	public void convertVideo(MultimediaConversionRequest request) throws Exception {
		
		logger.trace("MultimediaConverterImpl.convertVideo()");

		request.setConversionPerformed(false);
		request.setThumbnailCreated(false);

		File inFile = request.getInFile();
		if( null == inFile ) {
			throw new Exception("Must provide a file for video conversion");
		}

		MultimediaConversionProgress progress = request.getProgress();
		if( null == progress ) {
			progress = MultimediaConversionProgressNull.getSingleton();
		}
		
		// Get information about video
		FFmpegMediaInfo videoInfo = null;
		{
			FFmpegProcessor ffmpeg = FFmpeg.getProcessor(null);
			videoInfo = ffmpeg.getMediaInfo( inFile );
		}
		
		// Check if conversion is required
		boolean conversionRequired = videoConversionThreshold.isConversionRequired(
				videoInfo.getVideoCodec()
				,videoInfo.getBitRate()
				,videoInfo.getAudioCodec()
				,videoInfo.getBitRate()
				,videoInfo.getWidth()
				,videoInfo.getHeight(),
				request.getInFileSizeMb());

		// Report length and dimensions
		populateMediaDimensionsParams(request, videoInfo);
		
		FFmpegMediaInfo outVideoInfo = null;
		if( false == conversionRequired ) {
			// Conversion not required, converted file is the uploaded file
			request.setOutFile(inFile);
			progress.updateProgress(100);
			outVideoInfo = videoInfo;

		} else {
			File outFile = request.getOutFile();
			if( null == outFile ) {
				File parentDir = inFile.getParentFile();
				outFile = File.createTempFile("conv", ".mp4", parentDir);
			}
			
			FFmpegProcessor ffmpeg = FFmpeg.getProcessor(progress);
			ffmpeg.convertVideo(videoInfo, outFile);
			
			request.setOutFile(outFile);
			request.setConversionPerformed(true);

			outVideoInfo = ffmpeg.getMediaInfo( outFile );
			populateMediaDimensionsParams(request, outVideoInfo);
		}
		
		// Create thumbnail
		if( request.isThumbnailRequested() ){
			File thumbnailFile = request.getThumbnailFile();
			if( null == thumbnailFile ) {
				File parentDir = inFile.getParentFile();

				String name = inFile.getName();
				int index = name.lastIndexOf('.');
				if( index > 0 ) {
					name = name.substring(0, index);
				}
				name = name+"_thumb.jpg";
				
				thumbnailFile = new File(parentDir, name);
			}
			
			FFmpegProcessor ffmpeg = FFmpeg.getProcessor(null);
			ffmpeg.createThumbnail(
					outVideoInfo, 
					thumbnailFile, 
					MultimediaConfiguration.getImageThumbWidth(),
					MultimediaConfiguration.getVideoThumbHeight()
				);
			
			request.setThumbnailFile(thumbnailFile);
			request.setThumbnailCreated(true);

			ImageMagickInfo imInfo = ImageMagick.getInfo();
			ImageMagickProcessor im = imInfo.getProcessor(progress);
			ImageInfo thumbImageInfo = im.getImageInfo( thumbnailFile );
			request.setThumbnailHeight( thumbImageInfo.height );
			request.setThumbnailWidth( thumbImageInfo.width );
			request.setExifData( thumbImageInfo.exif );
		}
	}
	
	@Override
	public void convertAudio(MultimediaConversionRequest request) throws Exception {
		
		logger.trace("MultimediaConverterImpl.convertAudio()");

		request.setConversionPerformed(false);
		request.setThumbnailCreated(false);

		File inFile = request.getInFile();
		if( null == inFile ) {
			throw new Exception("Must provide a file for audio conversion");
		}
		
		MultimediaConversionProgress progress = request.getProgress();
		if( null == progress ) {
			progress = MultimediaConversionProgressNull.getSingleton();
		}

		// Get information about audio
		FFmpegMediaInfo audioInfo = null;
		{
			FFmpegProcessor ffmpeg = FFmpeg.getProcessor(null);
			audioInfo = ffmpeg.getMediaInfo( inFile );
		}
		
		// Check if conversion is required
		boolean conversionRequired = audioConversionThreshold.isConversionRequired(
				null
				,null
				,audioInfo.getAudioCodec()
				,audioInfo.getBitRate()
				,null
				,null
				, request.getInFileSizeMb());

		// Report length and dimensions
		request.setInDurationInSec( audioInfo.getDurationInSec() );
		
		if( false == conversionRequired ) {
			// Conversion not required, converted file is the uploaded file
			request.setOutFile(inFile);
			progress.updateProgress(100);
		} else {
			File outFile = request.getOutFile();
			if( null == outFile ) {
				File parentDir = inFile.getParentFile();
				outFile = File.createTempFile("conv", ".mp3", parentDir);
			}

			FFmpegProcessor ffmpeg = FFmpeg.getProcessor(progress);
			ffmpeg.convertAudio(audioInfo, outFile);
			
			request.setOutFile(outFile);
			request.setConversionPerformed(true);

			FFmpegMediaInfo outAudioInfo = ffmpeg.getMediaInfo( outFile );
			request.setOutDurationInSec( outAudioInfo.getDurationInSec() );
			request.setOutHeight(0);
			request.setOutWidth(0);
		}
	}
	
	@Override
	public void convertImage(MultimediaConversionRequest request) throws Exception {

		logger.trace("MultimediaConverterImpl.convertImage()");
		
		request.setConversionPerformed(false);
		request.setThumbnailCreated(false);

		File inFile = request.getInFile();
		if( null == inFile ) {
			throw new Exception("Must provide a file for image conversion");
		}
		
		MultimediaConversionProgress progress = request.getProgress();
		if( null == progress ) {
			progress = MultimediaConversionProgressNull.getSingleton();
		}

		ImageMagickInfo imInfo = ImageMagick.getInfo();
		
		// Get information about image
		ImageInfo imageInfo = null;
		if( imInfo.isAvailable ){
			ImageMagickProcessor imageMagick = imInfo.getProcessor();
			imageInfo = imageMagick.getImageInfo( inFile );
		}
		
		// Check if image comes from a photosphere camera
		boolean isPhotosphere = false;
		if( null != imageInfo 
		 && null != imageInfo.exif ){
			if( imageInfo.exif.isKnownPhotosphereCamera() ){
				isPhotosphere = true;
			}
		}
		
		// Extract XMP data
		XmpInfo xmpData = XmpExtractor.extractXmpInfo(inFile);
		if( null != xmpData ){
			request.setXmpData(xmpData);
			
			if( xmpData.usePanoramaViewer() ){
				isPhotosphere = true;
			}
		}

		boolean conversionRequired = false;
		boolean resizeRequired = false;
		boolean reorientationRequired = false;
		if( null != imageInfo ) {
			request.setInHeight( imageInfo.height );
			request.setInWidth( imageInfo.width );
			request.setExifData( imageInfo.exif );

			// Do not modify photosphere images
			if( !isPhotosphere ) {
				// Check if conversion is required
				conversionRequired = imageConversionThreshold.isConversionRequired(
						imageInfo.format
						,null
						,null
						,null
						, (long) imageInfo.width
						, (long) imageInfo.height
						, request.getInFileSizeMb());
				resizeRequired = imageConversionThreshold.isResizeRequired(
						(long) imageInfo.width
						, (long) imageInfo.height
						);
				
				if( imageInfo.orientation == ImageInfo.Orientation.REQUIRES_CONVERSION ) {
					reorientationRequired = true;
				}
			}
		}

		String outputExtension = null;
		if( null != imageInfo ){
			outputExtension = getExtensionFromImageFormat(imageInfo.format);
		}
		if( null == outputExtension ){
			outputExtension = "jpg";
		}
		
		if( request.isSkipConversion() ){
			progress.updateProgress(100);
			
		} else if( false == conversionRequired 
		 && false == resizeRequired 
		 && false == reorientationRequired 
		 ) {
			// Conversion not required, converted file is the uploaded file
			// Same applies if conversion is impossible because ImageMagick
			// is not present.
			request.setOutFile(inFile);
			progress.updateProgress(100);
			
		} else {
			File outFile = request.getOutFile();
			if( null == outFile ) {
				File parentDir = inFile.getParentFile();
				outFile = File.createTempFile("conv", "."+outputExtension, parentDir);
			}
			
			ImageMagickProcessor im = imInfo.getProcessor(progress);
			if( resizeRequired ) {
				im.resizeImage(
						imageInfo, 
						outFile, 
						MultimediaConfiguration.getImageMaxWidth(),
						MultimediaConfiguration.getImageMaxHeight()
					);
			} else if(conversionRequired) {
				im.convertImage(imageInfo, outFile);
			} else {
				im.reorientImage(imageInfo, outFile);
			}
			
			request.setOutFile(outFile);
			request.setConversionPerformed(true);

			ImageInfo outImageInfo = im.getImageInfo( outFile );
			request.setOutHeight( outImageInfo.height );
			request.setOutWidth( outImageInfo.width );
		}
		
		// Create thumbnail
		if( null != imageInfo && request.isThumbnailRequested() ){
			File thumbnailFile = request.getThumbnailFile();
			if( null == thumbnailFile ) {
				File parentDir = inFile.getParentFile();

				String name = inFile.getName();
				int index = name.lastIndexOf('.');
				if( index > 0 ) {
					name = name.substring(0, index);
				}
				name = name+"_thumb."+outputExtension;
				
				thumbnailFile = new File(parentDir, name);
			}

			ImageMagickProcessor im = imInfo.getProcessor(progress);
			im.resizeImage(
					imageInfo,
					thumbnailFile,
					MultimediaConfiguration.getImageThumbWidth(),
					MultimediaConfiguration.getImageThumbHeight()
				);
			
			request.setThumbnailFile(thumbnailFile);
			request.setThumbnailCreated(true);

			ImageInfo thumbImageInfo = im.getImageInfo( thumbnailFile );
			request.setThumbnailHeight( thumbImageInfo.height );
			request.setThumbnailWidth( thumbImageInfo.width );
		}
	}

	@Override
	public void createImageThumbnail(MultimediaConversionRequest request) throws Exception {

		logger.trace("MultimediaConverterImpl.createImageThumbnail()");
		
		request.setConversionPerformed(false);
		request.setThumbnailCreated(false);

		File inFile = request.getInFile();
		if( null == inFile ) {
			throw new Exception("Must provide a file for image conversion");
		}
		
		MultimediaConversionProgress progress = request.getProgress();
		if( null == progress ) {
			progress = MultimediaConversionProgressNull.getSingleton();
		}

		ImageMagickInfo imInfo = ImageMagick.getInfo();
		
		// Get information about image
		ImageInfo imageInfo = null;
		if( imInfo.isAvailable ){
			ImageMagickProcessor imageMagick = imInfo.getProcessor();
			imageInfo = imageMagick.getImageInfo( inFile );
		}

		if( null != imageInfo ) {
			request.setInHeight( imageInfo.height );
			request.setInWidth( imageInfo.width );
			request.setExifData( imageInfo.exif );
		}
		
		// Create thumbnail
		if( null != imageInfo && request.isThumbnailRequested() ){
			String outputExtension = getExtensionFromImageFormat(imageInfo.format);
			if( null == outputExtension ){
				outputExtension = "jpg";
			}

			File thumbnailFile = request.getThumbnailFile();
			if( null == thumbnailFile ) {
				File parentDir = inFile.getParentFile();

				String name = inFile.getName();
				int index = name.lastIndexOf('.');
				if( index > 0 ) {
					name = name.substring(0, index);
				}
				name = name+"_thumb."+outputExtension;
				
				thumbnailFile = new File(parentDir, name);
			}

			ImageMagickProcessor im = imInfo.getProcessor(progress);
			im.resizeImage(
					imageInfo, 
					thumbnailFile, 
					MultimediaConfiguration.getImageThumbWidth(),
					MultimediaConfiguration.getImageThumbHeight()
				);
			
			request.setThumbnailFile(thumbnailFile);
			request.setThumbnailCreated(true);

			ImageInfo thumbImageInfo = im.getImageInfo( thumbnailFile );
			request.setThumbnailHeight( thumbImageInfo.height );
			request.setThumbnailWidth( thumbImageInfo.width );
		}
	}

	private String getExtensionFromImageFormat(String imageFormat) {
		if ("JPEG".equalsIgnoreCase(imageFormat) || "JPG".equalsIgnoreCase(imageFormat)) {
			return "jpg";
		}
		else if ("GIF".equalsIgnoreCase(imageFormat)) {
			return "gif";
		}
		else if ("PNG".equalsIgnoreCase(imageFormat)) {
			return "png";
		}
		return null;
	}

	private void populateMediaDimensionsParams(final MultimediaConversionRequest request, FFmpegMediaInfo videoInfo) {
		if( null == videoInfo.getDurationInSec() ) {
			request.setInDurationInSec( (float)0.0 );
		} else {
			request.setInDurationInSec(videoInfo.getDurationInSec());
		}
		if (null == videoInfo.getHeight()) {
			request.setInHeight(0);
		} else {
			request.setInHeight(videoInfo.getHeight().intValue());
		}
		if (null == videoInfo.getWidth()) {
			request.setInWidth(0);
		} else {
			request.setInWidth(videoInfo.getWidth().intValue());
		}
	}

}
