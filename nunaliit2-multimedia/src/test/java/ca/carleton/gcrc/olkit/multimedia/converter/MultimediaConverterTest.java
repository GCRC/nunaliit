package ca.carleton.gcrc.olkit.multimedia.converter;

import java.io.File;

import junit.framework.TestCase;
import ca.carleton.gcrc.olkit.multimedia.converter.impl.MultimediaConverterImpl;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageInfo;
import ca.carleton.gcrc.olkit.multimedia.imageMagick.ImageMagick;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaTestingProgress;
import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;

public class MultimediaConverterTest extends TestCase {

	public void testConvertImage() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("S13200210.GIF");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );

		converter.convertImage(request);
		
		// Verify input sizes
		if( 419 != request.getInWidth() ) {
			fail("Unexpected width");
		}
		if( 400 != request.getInHeight() ) {
			fail("Unexpected height");
		}
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "image/gif".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
	}

	public void testConvertImageXcf() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("routes.xcf");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );

		converter.convertImage(request);
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "image/jpeg".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
	}
	
	public void testConvertVideo() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
	
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("whale.WMV");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );
		
		converter.convertVideo(request);
		
		// Verify input sizes
		if( 320 != request.getInWidth() ) {
			fail("Unexpected width");
		}
		if( 240 != request.getInHeight() ) {
			fail("Unexpected height");
		}
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "video/mp4".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
	}
	
	public void testConvertVideoWebm() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
	
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("gizmo.webm");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );
		
		converter.convertVideo(request);
		
		// Verify input sizes
		if( 558 != request.getInWidth() ) {
			fail("Unexpected width");
		}
		if( 314 != request.getInHeight() ) {
			fail("Unexpected height");
		}
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "video/mp4".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
	}

	public void testConvertAudio() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();
	
		File inFile = TestConfiguration.getTestFile("steps_sound.ogg");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setProgress( new MultimediaTestingProgress() );
		
		converter.convertAudio(request);
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "audio/mp3".equals( sf.getMimeType() ) 
		 && false == "audio/mpeg".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
		
	}

	public void testConvertM4aAudio() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();
	
		File inFile = TestConfiguration.getTestFile("sample.m4a");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setProgress( new MultimediaTestingProgress() );
		
		converter.convertAudio(request);
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "audio/mp3".equals( sf.getMimeType() ) 
		 && false == "audio/mpeg".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
		
	}

	public void testConvertAacAudio() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();
	
		File inFile = TestConfiguration.getTestFile("sample.aac");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setProgress( new MultimediaTestingProgress() );
		
		converter.convertAudio(request);
		
		SystemFile sf = SystemFile.getSystemFile(request.getOutFile());
		if( false == "audio/mp3".equals( sf.getMimeType() ) 
		 && false == "audio/mpeg".equals( sf.getMimeType() ) ) {
			fail("Unexpected mime type: "+sf.getMimeType());
		}
		
	}

	public void testConversionReorientImage() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("portrait.jpeg");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );

		converter.convertImage(request);
		
		// Verify that image was rotated
		ImageInfo info = ImageMagick.getInfo().getProcessor().getImageInfo(request.getOutFile());
		if( info.orientation == ImageInfo.Orientation.REQUIRES_CONVERSION ) {
			fail("Unexpected orientation");
		}
	}

	public void testMovieWithEscapedFilename() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("movie name with spaces.wmv");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );

		converter.convertVideo(request);
		
		// Verify that conversion was performed
		if( false == request.getOutFile().exists() ){
			fail("Conversion not performed");
		}
	}

	public void testImageWithEscapedFilename() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		MultimediaConverterImpl converter = new MultimediaConverterImpl();

		File inFile = TestConfiguration.getTestFile("image name with spaces.gif");
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile(inFile);
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaTestingProgress() );

		converter.convertImage(request);
		
		// Verify that conversion was performed
		if( false == request.getOutFile().exists() ){
			fail("Conversion not performed");
		}
	}
}
