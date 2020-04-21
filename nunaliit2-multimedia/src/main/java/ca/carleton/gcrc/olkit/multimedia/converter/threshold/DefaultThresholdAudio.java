package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class DefaultThresholdAudio implements MultimediaConversionThreshold {

	protected static final long DEFAULT_MAX_BITRATE = 250000;
	protected static final String DEFAULT_REQUIRED_AUDIO_ENCODING = "aac";

	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {
		boolean isConversionRequired = false;

		if (audioRate == null
				|| audioRate > DEFAULT_MAX_BITRATE
				|| !DEFAULT_REQUIRED_AUDIO_ENCODING.equalsIgnoreCase(audioFormat)
		) {
			isConversionRequired = true;
		}

		return isConversionRequired;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		return false;
	}

	public String toString() {
		return this.getClass().getSimpleName();
	}

}
