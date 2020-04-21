package ca.carleton.gcrc.olkit.multimedia.utils;

import ca.carleton.gcrc.olkit.multimedia.converter.threshold.ThresholdLogicalAnd;
import junit.framework.TestCase;

import java.util.Properties;

/**
 * Test the multimedia threshold properties. Specifically, when a threshold is not configured, when it has one threshold
 * setting, and when it has two threshold settings.
 */
public class MultimediaConfigurationTest extends TestCase
{
	public void testConfigureFromProperties_imageThresholdNone() {
		Properties props = new Properties();
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseImageThreshold(props.getProperty(
				"multimedia.conversion.image.threshold", null));

		assertNull(threshold);
	}

	public void testConfigureFromProperties_imageThresholdOne() {
		Properties props = new Properties();
		props.setProperty("multimedia.conversion.image.threshold", "jpeg,500,*");
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseImageThreshold(props.getProperty(
				"multimedia.conversion.image.threshold", null));

		assertNotNull(threshold);
		assertFalse(threshold.isConversionRequired("JPEG", null, null, null, 500L, 400L, 10000000L));
	}

	public void testConfigureFromProperties_imageThresholdTwo() {
		Properties props = new Properties();
		props.setProperty("multimedia.conversion.image.threshold", "jpeg,500,*|PNG,1000,10");
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseImageThreshold(props.getProperty(
				"multimedia.conversion.image.threshold", null));

		assertNotNull(threshold);
		assertFalse(threshold.isConversionRequired("JPEG", null, null, null, 500L, 400L, 100000L));
		assertFalse(threshold.isConversionRequired("png", null, null, null, 1000L, 1000L, 10L));
		assertTrue(threshold.isConversionRequired("png", null, null, null, 1200L, 1000L, 10L));
		assertTrue(threshold.isConversionRequired("png", null, null, null, 1000L, 1000L, 11L));
	}

	public void testConfigureFromProperties_audioThresholdNone() {
		Properties props = new Properties();
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseAudioThreshold(props.getProperty(
				"multimedia.conversion.audio.threshold", null));

		assertNull(threshold);
	}

	public void testConfigureFromProperties_audioThresholdOne() {
		Properties props = new Properties();
		props.setProperty("multimedia.conversion.audio.threshold", "mpeg,128000,*");
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseAudioThreshold(props.getProperty(
				"multimedia.conversion.audio.threshold", null));

		assertNotNull(threshold);
		assertFalse(threshold.isConversionRequired(null, null, "mpeg", 128000L, null, null, 1000L));
		assertTrue(threshold.isConversionRequired(null, null, "ogg", 128000L, null, null, 1000L));
	}

	public void testConfigureFromProperties_audioThresholdTwo() {
		Properties props = new Properties();
		props.setProperty("multimedia.conversion.audio.threshold", "mpeg,128000,*|ogg,130000,10");
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseAudioThreshold(props.getProperty(
				"multimedia.conversion.audio.threshold", null));

		assertNotNull(threshold);
		assertFalse(threshold.isConversionRequired(null, null, "mpeg", 128000L, null, null, 10L));
		assertFalse(threshold.isConversionRequired(null, null, "ogg", 130000L, null, null, 10L));
		assertTrue(threshold.isConversionRequired(null, null, "ogg", 140000L, null, null, 10L));
		assertTrue(threshold.isConversionRequired(null, null, "ogg", 130000L, null, null, 30L));
	}

	public void testConfigureFromProperties_videoThresholdNone() {
		Properties props = new Properties();
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseVideoThreshold(props.getProperty(
				"multimedia.conversion.video.threshold", null));

		assertNull(threshold);
	}

	public void testConfigureFromProperties_videoThresholdOne() {
		Properties props = new Properties();
		props.setProperty("multimedia.conversion.video.threshold", "h264,250000,aac,250000,*,*");
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseVideoThreshold(props.getProperty(
				"multimedia.conversion.video.threshold", null));

		assertNotNull(threshold);
		assertFalse(threshold.isConversionRequired("h264", 250000L, "aac", 128000L, 480L, 320L, 10L));
		assertTrue(threshold.isConversionRequired("h264", 250000L, "wav", 128000L, 2440L, 1080L, 10L));
	}

	public void testConfigureFromProperties_videoThresholdTwo() {
		Properties props = new Properties();
		props.setProperty("multimedia.conversion.video.threshold", "h264,250000,aac,250000,*,*|mp4,128000,aac,128000,2440,1000");
		ThresholdLogicalAnd threshold = MultimediaConfiguration.parseVideoThreshold(props.getProperty(
				"multimedia.conversion.video.threshold", null));

		assertNotNull(threshold);
		assertFalse(threshold.isConversionRequired("h264", 250000L, "aac", 128000L, 480L, 320L, 10L));
		assertFalse(threshold.isConversionRequired("mp4", 128000L, "aac", 128000L, 480L, 320L, 10L));
		assertTrue(threshold.isConversionRequired("h264", 250000L, "wav", 128000L, 2440L, 1080L, 10L));
		assertTrue(threshold.isConversionRequired("mp4", 128000L, "aac", 128000L, 2445L, 500L, 1000L));
	}
}
