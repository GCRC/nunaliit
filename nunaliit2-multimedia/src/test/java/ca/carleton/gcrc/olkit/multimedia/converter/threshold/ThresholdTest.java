package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import junit.framework.TestCase;

public class ThresholdTest extends TestCase {

	public void testImageThreshold() {
		ThresholdImage imageThreshold = ThresholdImage.parseString("JPEG,500");
		
		if( true == imageThreshold.isConversionRequired("JPEG", null, null, null, new Long(500), new Long(500)) ) {
			fail("Unexpected JPEG/500");
		}
		
		if( false == imageThreshold.isConversionRequired("JPEG", null, null, null, new Long(501), new Long(501)) ) {
			fail("Unexpected JPEG/501");
		}

		if( false == imageThreshold.isConversionRequired("PNG", null, null, null, new Long(500), new Long(500)) ) {
			fail("Unexpected PNG/500");
		}
	}

	public void testDefaultImageThreshold() {
		DefaultThresholdImage imageThreshold = new DefaultThresholdImage();
		
		if( true == imageThreshold.isConversionRequired("JPEG", null, null, null, new Long(500), new Long(500)) ) {
			fail("Unexpected JPEG/500");
		}
		
		if( false == imageThreshold.isConversionRequired("JPEG", null, null, null, new Long(501), new Long(501)) ) {
			fail("Unexpected JPEG/501");
		}

		if( true == imageThreshold.isConversionRequired("PNG", null, null, null, new Long(500), new Long(500)) ) {
			fail("Unexpected PNG/500");
		}
	}

	public void testAudioThreshold() {
		ThresholdAudio audioThreshold = ThresholdAudio.parseString("mpeg,128000");
		
		if( true == audioThreshold.isConversionRequired(null, null, "mpeg", new Long(128000), null, null) ) {
			fail("Unexpected mpeg/128000");
		}
		
		if( false == audioThreshold.isConversionRequired(null, null, "ogg", new Long(128000), null, null) ) {
			fail("Unexpected ogg/128000");
		}

		if( false == audioThreshold.isConversionRequired(null, null, "mpeg", new Long(128001), null, null) ) {
			fail("Unexpected mpeg/128001");
		}
	}

	public void testDefaultAudioThreshold() {
		DefaultThresholdAudio audioThreshold = new DefaultThresholdAudio();
		
		if( true == audioThreshold.isConversionRequired(null, null, "mp3", new Long(250000), null, null) ) {
			fail("Unexpected mp3/250000");
		}
		
		if( false == audioThreshold.isConversionRequired(null, null, "ogg", new Long(250000), null, null) ) {
			fail("Unexpected ogg/250000");
		}

		if( false == audioThreshold.isConversionRequired(null, null, "mp3", new Long(250001), null, null) ) {
			fail("Unexpected mp3/250001");
		}
	}

	public void testVideoThreshold() {
		ThresholdVideo videoThreshold = ThresholdVideo.parseString("h264,250000,mpeg4aac,250000,500");
		
		if( true == videoThreshold.isConversionRequired("h264", new Long(250000), "mpeg4aac", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250000/mpeg4acc/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("video", new Long(250000), "mpeg4aac", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected video/250000/mpeg4acc/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("h264", new Long(250001), "mpeg4aac", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250001/mpeg4acc/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("h264", new Long(250000), "audio", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250000/audio/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("h264", new Long(250000), "mpeg4aac", new Long(250001), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250000/mpeg4acc/250001/500");
		}

		if( false == videoThreshold.isConversionRequired("h264", new Long(250000), "mpeg4aac", new Long(250000), new Long(501), new Long(501)) ) {
			fail("Unexpected h264/250000/mpeg4acc/250000/501");
		}
	}

	public void testDefaultVideoThreshold() {
		DefaultThresholdVideo videoThreshold = new DefaultThresholdVideo();
		
		if( true == videoThreshold.isConversionRequired("h264", new Long(250000), "mpeg4aac", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250000/mpeg4acc/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("video", new Long(250000), "mpeg4aac", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected video/250000/mpeg4acc/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("h264", new Long(250001), "mpeg4aac", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250001/mpeg4acc/250000/500");
		}

		if( false == videoThreshold.isConversionRequired("h264", new Long(250000), "audio", new Long(250000), new Long(500), new Long(500)) ) {
			fail("Unexpected h264/250000/audio/250000/500");
		}
	}
	
	public void testLogicalAnd() {
		ThresholdDummy tTrue = new ThresholdDummy(true, true);
		ThresholdDummy tFalse = new ThresholdDummy(false, false);
		
		{
			ThresholdLogicalAnd and = new ThresholdLogicalAnd();
			and.addThreshold(tTrue);
			and.addThreshold(tTrue);
			
			if( false == and.isConversionRequired(null, null, null, null, null, null) ) {
				fail("Conversion true-true");
			}
			
			if( false == and.isResizeRequired(null, null) ) {
				fail("Resize true-true");
			}
		}
		
		{
			ThresholdLogicalAnd and = new ThresholdLogicalAnd();
			and.addThreshold(tFalse);
			and.addThreshold(tFalse);
			
			if( true == and.isConversionRequired(null, null, null, null, null, null) ) {
				fail("Conversion false-false");
			}
			
			if( true == and.isResizeRequired(null, null) ) {
				fail("Resize false-false");
			}
		}
		
		{
			ThresholdLogicalAnd and = new ThresholdLogicalAnd();
			and.addThreshold(tFalse);
			and.addThreshold(tTrue);
			
			if( true == and.isConversionRequired(null, null, null, null, null, null) ) {
				fail("Conversion false-true");
			}
			
			if( true == and.isResizeRequired(null, null) ) {
				fail("Resize false-true");
			}
		}
	}
}
