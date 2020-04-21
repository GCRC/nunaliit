package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class DefaultThresholdImage implements MultimediaConversionThreshold {

	protected static final int DEFAULT_MAX_DIMENSION = 500;
	protected static final Set<String> DEFAULT_VALID_IMAGE_FORMATS = new HashSet<>(Arrays.asList(
			"jpg", "jpeg", "gif", "png"));

	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {

		boolean isConversionRequired = false;

		if (isResizeRequired(imageWidth, imageHeight)
				|| !DEFAULT_VALID_IMAGE_FORMATS.contains(videoFormat.toLowerCase())) {
			isConversionRequired = true;
		}

		return isConversionRequired;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		return imageWidth == null || imageWidth > DEFAULT_MAX_DIMENSION || imageHeight > DEFAULT_MAX_DIMENSION;
	}

	public String toString() {
		return this.getClass().getSimpleName();
	}
}
