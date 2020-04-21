package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class ThresholdDummy implements MultimediaConversionThreshold {

	private final boolean conversionRequired;
	private final boolean resizeRequired;
	
	public ThresholdDummy(boolean conversionRequired, boolean resizeRequired) {
		this.conversionRequired = conversionRequired;
		this.resizeRequired = resizeRequired;
	}
	
	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
										Long imageWidth, Long imageHeight, Long fileSizeMb) {
		return conversionRequired;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		return resizeRequired;
	}
}
