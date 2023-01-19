package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class DefaultThresholdAudio implements MultimediaConversionThreshold {

	protected static final long DEFAULT_MAX_BITRATE = 250000;
	protected static final String DEFAULT_REQUIRED_AUDIO_ENCODING = "mp3";

	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {
		if (audioFormat.equals("mp3")) {
			return false;
		} else if (audioRate == null
				|| audioRate > DEFAULT_MAX_BITRATE
				|| !DEFAULT_REQUIRED_AUDIO_ENCODING.equalsIgnoreCase(audioFormat)
		) {
			return true;
		}
		return false;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		return false;
	}

	public String toString() {
		return this.getClass().getSimpleName();
	}

}
