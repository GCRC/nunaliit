/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id$
*/
package ca.carleton.gcrc.olkit.multimedia.imageMagick;

import java.io.File;

import junit.framework.TestCase;
import ca.carleton.gcrc.olkit.multimedia.converter.ExifData;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaTestingProgress;
import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;

public class ImageMagickTest extends TestCase {

	public void testGetInfo() {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagick.getInfo();
	}

	public void testGetImageInfo1() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("S13200210.GIF");
		ImageInfo info = im.getImageInfo(file);
		
		if( info.file != file ) {
			fail("Unexpected file");
		}
		if( false == "GIF".equals(info.format) ) {
			fail("Unexpected format");
		}
		if( 419 != info.width ) {
			fail("Unexpected width");
		}
		if( 400 != info.height ) {
			fail("Unexpected height");
		}
	}

	public void testGetImageInfo2() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("beaver_owl.gif");
		ImageInfo info = im.getImageInfo(file);
		
		if( info.file != file ) {
			fail("Unexpected file");
		}
		if( false == "GIF".equals(info.format) ) {
			fail("Unexpected format");
		}
		if( 1076 != info.width ) {
			fail("Unexpected width");
		}
		if( 788 != info.height ) {
			fail("Unexpected height");
		}
	}

	public void testGetImageInfo3() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("Can_1850.JPG");
		ImageInfo info = im.getImageInfo(file);
		
		if( info.file != file ) {
			fail("Unexpected file");
		}
		if( false == "JPEG".equals(info.format) ) {
			fail("Unexpected format");
		}
		if( 2097 != info.width ) {
			fail("Unexpected width");
		}
		if( 1326 != info.height ) {
			fail("Unexpected height");
		}
	}

	public void testGetImageInfoOrientation1() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("portrait.jpeg");
		ImageInfo info = im.getImageInfo(file);

		if( info.orientation != ImageInfo.Orientation.REQUIRES_CONVERSION ) {
			fail("Unexpected orientation");
		}
	}

	public void testGetImageInfoOrientation2() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("landscape.jpeg");
		ImageInfo info = im.getImageInfo(file);

		if( info.orientation != ImageInfo.Orientation.CORRECT ) {
			fail("Unexpected orientation");
		}
	}

	public void testGetImageInfoExif() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("portrait.jpeg");
		ImageInfo info = im.getImageInfo(file);
		ExifData exifData = info.exif;
		
		if( null == exifData ) {
			fail("Expected EXIF data");
			
		} else if( false == exifData.containsKey("ColorSpace") ){
			fail("Expected 'ColorSpace' in EXIF data");
			
		} else if( false == "1".equals(exifData.getRawData("ColorSpace")) ) {
			fail("Unexpected value for 'ColorSpace' in EXIF data: "+exifData.getRawData("ColorSpace"));
		}
	}

	public void testConvert() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("beaver_owl.gif");
		File outputFile = new File(file.getParentFile(),file.getName()+".jpg");

		im.convertImage(file, outputFile);
	}

	public void testConvertReorient() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("portrait.jpeg");
		File outputFile = new File(file.getParentFile(),file.getName()+".converted.oriented.jpg");

		im.convertImage(file, outputFile);

		ImageInfo outputInfo = im.getImageInfo(outputFile);

		if( outputInfo.orientation != ImageInfo.Orientation.CORRECT ) {
			fail("Unexpected orientation");
		}
	}

	public void testResize() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("beaver_owl.gif");
		File outputFile = new File(file.getParentFile(),file.getName()+".500x500.jpg");

		im.resizeImage(file, outputFile,500,500);
	}

	// Test that resizing also re-orients
	public void testResizeReorient() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("portrait.jpeg");
		File outputFile = new File(file.getParentFile(),file.getName()+".50x50.oriented.jpg");

		im.resizeImage(file, outputFile,50,50);

		ImageInfo outputInfo = im.getImageInfo(outputFile);

		if( outputInfo.orientation != ImageInfo.Orientation.CORRECT ) {
			fail("Unexpected orientation");
		}
	}

	public void testReorient() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		ImageMagickInfo imInfo = ImageMagick.getInfo();
		if( false == imInfo.isAvailable ) {
			// Skip test
			System.out.println("Skipping test because ImageMagick is not present");
			return;
		}
		
		ImageMagickProcessor im = imInfo.getProcessor(new MultimediaTestingProgress());
		
		File file = TestConfiguration.getTestFile("portrait.jpeg");
		File outputFile = new File(file.getParentFile(),file.getName()+".oriented.jpeg");

		im.reorientImage(file, outputFile);

		ImageInfo outputInfo = im.getImageInfo(outputFile);

		if( outputInfo.orientation != ImageInfo.Orientation.CORRECT ) {
			fail("Unexpected orientation");
		}
	}
}
