package ca.carleton.gcrc.olkit.multimedia.converter.impl;

import java.io.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.olkit.multimedia.apachePDFBox.ApachePDFBoxProcessor;
import ca.carleton.gcrc.olkit.multimedia.apachePDFBox.ApachePDFBoxProcessorDefault;
import ca.carleton.gcrc.olkit.multimedia.apachePDFBox.PdfInfo;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionRequest;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConverter;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.DefaultThresholdAudio;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.DefaultThresholdImage;
import ca.carleton.gcrc.olkit.multimedia.converter.threshold.DefaultThresholdVideo;



public class MultimediaConverterImplForEmbededDecoder implements MultimediaConverter {

	static public int IMAGE_MAX_WIDTH = 1000;
	static public int IMAGE_MAX_HEIGHT = 1000;
	static public int IMAGE_THUMB_HEIGHT = 350;
	static public int IMAGE_THUMB_WIDTH = 350;
	static public int VIDEO_THUMB_HEIGHT = 240;
	static public int VIDEO_THUMB_WIDTH = 320;
	
	static public MultimediaConversionThreshold imageConversionThreshold = new DefaultThresholdImage();
	static public MultimediaConversionThreshold audioConversionThreshold = new DefaultThresholdAudio();
	static public MultimediaConversionThreshold videoConversionThreshold = new DefaultThresholdVideo();

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());



	@Override
	public void convertImage(MultimediaConversionRequest request) throws Exception {

		logger.trace("MultimediaConverterImplForPdf.convertImage()");
		
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

		
		// Get information about image
		PdfInfo pdfInfo = null;
		
		ApachePDFBoxProcessor pdfbox = ApachePDFBoxProcessorDefault.getProcessor();
		pdfInfo = pdfbox.getPdfInfo( inFile );
	
		//Conversion never required for PDF file format.
		if( request.isSkipConversion() ){
			progress.updateProgress(100);
			
		} else {
			// Conversion not required, converted file is the uploaded file
			// Same applies if conversion is impossible because ImageMagick
			// is not present.
			request.setOutFile(inFile);
			progress.updateProgress(100);
		
		}
		if (null == pdfInfo) {
			throw new Exception ("Error in producing the pdfinfo object");
		}
		
		// Create thumbnail
		if( null != pdfInfo && request.isThumbnailRequested() ){
			File thumbnailFile = request.getThumbnailFile();
			if( null == thumbnailFile ) {
				File parentDir = inFile.getParentFile();

				String name = inFile.getName();
				int index = name.lastIndexOf('.');
				if( index > 0 ) {
					name = name.substring(0, index);
				}
				name = name+"_thumb."+ ApachePDFBoxProcessorDefault.IMAGEFORMAT;
				
				thumbnailFile = new File(parentDir, name);
			}

			
			pdfbox.createPdfThumbnail(pdfInfo, thumbnailFile, IMAGE_THUMB_WIDTH, IMAGE_THUMB_HEIGHT);
			
			request.setThumbnailFile(thumbnailFile);
			request.setThumbnailCreated(true);

			
			request.setThumbnailHeight( pdfInfo.height );
			request.setThumbnailWidth( pdfInfo.width );
		}
	}

	

	@Override
	public void convertVideo(MultimediaConversionRequest request) throws Exception {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void convertAudio(MultimediaConversionRequest request) throws Exception {
		// TODO Auto-generated method stub
		
	}



	@Override
	public void createImageThumbnail(MultimediaConversionRequest request) throws Exception {
		// TODO Auto-generated method stub
		
	}
}
