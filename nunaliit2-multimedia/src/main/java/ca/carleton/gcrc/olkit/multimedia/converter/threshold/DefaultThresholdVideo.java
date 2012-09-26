package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class DefaultThresholdVideo implements MultimediaConversionThreshold {

	@Override
	public boolean isConversionRequired(
			String videoFormat
			,Long videoRate
			,String audioFormat
			,Long audioRate
			,Long imageWidth
			,Long imageHeight
			) {

		if( null == videoRate ) {
			return true;
			
		} else if( videoRate.longValue() > 250000 ) {
			return true;
		}
		
		if( false == "h264".equals( videoFormat ) ) {
			return true;
		}
		
		if( false == "mpeg4aac".equals( audioFormat ) ) {
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