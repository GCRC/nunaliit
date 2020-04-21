package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import junit.framework.TestCase;

public class ThresholdTest extends TestCase
{
	public void testImageThreshold() {
		ThresholdImage imageThreshold = ThresholdImage.parseString("JPEG,500,*");

		if (imageThreshold.isConversionRequired("JPEG", null, null, null, 500L, 500L, 10L)) {
			fail("Unexpected JPEG/500");
		}

		if (!imageThreshold.isConversionRequired("JPEG", null, null, null, 501L, 501L, 10L)) {
			fail("Unexpected JPEG/501");
		}

		if (!imageThreshold.isConversionRequired("PNG", null, null, null, 500L, 500L, 10L)) {
			fail("Unexpected PNG/500");
		}
	}

	public void testDefaultImageThreshold() {
		DefaultThresholdImage imageThreshold = new DefaultThresholdImage();

		assertFalse(imageThreshold.isConversionRequired(
				"JPEG", null, null, null, 500L, 500L, 10L));

		assertTrue(imageThreshold.isConversionRequired(
				"JPEG", null, null, null, 501L, 500L, 10L));

		assertTrue(imageThreshold.isConversionRequired(
				"BMP", null, null, null, 200L, 200L, 10L));

		assertFalse(imageThreshold.isConversionRequired(
				"PNG", null, null, null, 500L, 500L, 10L));

		assertFalse(imageThreshold.isConversionRequired(
				"JPG", null, null, null, 500L, 500L, 10L));

		assertTrue(imageThreshold.isConversionRequired(
				"JPG", null, null, null, 1000L, 500L, 10L));
	}

	public void testAudioThreshold() {
		ThresholdAudio audioThreshold = ThresholdAudio.parseString("mpeg,128000,10");

		if (audioThreshold.isConversionRequired(null, null, "mpeg", 128000L, null, null, 10L)) {
			fail("Unexpected mpeg/128000/10");
		}

		if (!audioThreshold.isConversionRequired(null, null, "ogg", 128000L, null, null, 10L)) {
			fail("Unexpected ogg/128000/10");
		}

		if (!audioThreshold.isConversionRequired(null, null, "mpeg", 128001L, null, null, 10L)) {
			fail("Unexpected mpeg/128001/10");
		}

		if (!audioThreshold.isConversionRequired(null, null, "mpeg", 128000L, null, null, 20L)) {
			fail("Unexpected mpeg/128000/20");
		}
	}

	public void testDefaultAudioThreshold() {
		DefaultThresholdAudio audioThreshold = new DefaultThresholdAudio();

		assertFalse("Unexpected aac/250000", audioThreshold.isConversionRequired(
				null, null, DefaultThresholdAudio.DEFAULT_REQUIRED_AUDIO_ENCODING, 250000L, null, null, 10L));

		assertTrue("Unexpected ogg/250000", audioThreshold.isConversionRequired(
				null, null, "ogg", 250000L, null, null, 10L));

		assertTrue("Unexpected aac/250001", audioThreshold.isConversionRequired(
				null, null, DefaultThresholdAudio.DEFAULT_REQUIRED_AUDIO_ENCODING, 250001L, null, null, 10L));
	}

	public void testVideoThreshold() {
		ThresholdVideo videoThreshold = ThresholdVideo.parseString("h264,250000,mpeg4aac,250000,500,10");

		assertFalse("Unexpected h264/250000/mpeg4aac/250000/500", videoThreshold.isConversionRequired(
				"h264", 250000L, "mpeg4aac", 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected video/250000/mpeg4aac/250000/500", videoThreshold.isConversionRequired(
				"video", 250000L, "mpeg4aac", 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected h264/250001/mpeg4aac/250000/500", videoThreshold.isConversionRequired(
				"h264", 250001L, "mpeg4aac", 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected h264/250000/mpeg4aac/250000/500", videoThreshold.isConversionRequired(
				"h264", 250000L, "audio", 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected h264/250000/mpeg4aac/250001/500", videoThreshold.isConversionRequired(
				"h264", 250000L, "mpeg4aac", 250001L, 500L, 500L, 10L));

		assertTrue("Unexpected h264/250000/mpeg4aac/250000/501", videoThreshold.isConversionRequired(
				"h264", 250000L, "mpeg4aac", 250000L, 501L, 501L, 10L));

		assertTrue("Unexpected h264/250000/mpeg4aac/250000/500", videoThreshold.isConversionRequired(
				"h264", 250000L, "mpeg4aac", 250000L, 500L, 500L, 11L));
	}

	public void testDefaultVideoThreshold() {
		DefaultThresholdVideo videoThreshold = new DefaultThresholdVideo();

		assertFalse("Unexpected h264/250000/aac/250000/500", videoThreshold.isConversionRequired(
				"h264", 250000L, DefaultThresholdVideo.DEFAULT_REQUIRED_AUDIO_ENCODING, 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected video/250000/aac/250000/500", videoThreshold.isConversionRequired(
				"video", 250000L, DefaultThresholdVideo.DEFAULT_REQUIRED_AUDIO_ENCODING, 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected h264/250001/aac/250000/500", videoThreshold.isConversionRequired(
				"h264", 250001L, DefaultThresholdVideo.DEFAULT_REQUIRED_AUDIO_ENCODING, 250000L, 500L, 500L, 10L));

		assertTrue("Unexpected h264/250000/audio/250000/500", videoThreshold.isConversionRequired(
				"h264", 250000L, "audio", 250000L, 500L, 500L, 10L));
	}

	public void testLogicalAnd() {
		ThresholdDummy tTrue = new ThresholdDummy(true, true);
		ThresholdDummy tFalse = new ThresholdDummy(false, false);

		{
			ThresholdLogicalAnd and = new ThresholdLogicalAnd();
			and.addThreshold(tTrue);
			and.addThreshold(tTrue);

			if (!and.isConversionRequired(null, null, null, null, null, null, 10L)) {
				fail("Conversion true-true");
			}

			if (!and.isResizeRequired(null, null)) {
				fail("Resize true-true");
			}
		}

		{
			ThresholdLogicalAnd and = new ThresholdLogicalAnd();
			and.addThreshold(tFalse);
			and.addThreshold(tFalse);

			if (and.isConversionRequired(null, null, null, null, null, null, 10L)) {
				fail("Conversion false-false");
			}

			if (and.isResizeRequired(null, null)) {
				fail("Resize false-false");
			}
		}

		{
			ThresholdLogicalAnd and = new ThresholdLogicalAnd();
			and.addThreshold(tFalse);
			and.addThreshold(tTrue);

			if (and.isConversionRequired(null, null, null, null, null, null, 10L)) {
				fail("Conversion false-true");
			}

			if (and.isResizeRequired(null, null)) {
				fail("Resize false-true");
			}
		}
	}
}
