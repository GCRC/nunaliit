package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class DefaultThresholdAudio implements MultimediaConversionThreshold {

	@Override
	public boolean isConversionRequired(
			String videoFormat
			,Long videoRate
			,String audioFormat
			,Long audioRate
			,Long imageWidth
			,Long imageHeight
			) {

		if( null == audioRate ) {
			return true;
		} else if( audioRate.longValue() > 250000 ) {
			return true;
		}
		if( false == "mp3".equals( audioFormat ) ) {
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
