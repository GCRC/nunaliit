package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class DefaultThresholdImage implements MultimediaConversionThreshold {

	@Override
	public boolean isConversionRequired(
			String videoFormat
			,Long videoRate
			,String audioFormat
			,Long audioRate
			,Long imageWidth
			,Long imageHeight
			) {

		if( isResizeRequired(imageWidth, imageHeight) ) {
			return true;
		}
		
		if( false == "JPEG".equals( videoFormat )
		 && false == "GIF".equals( videoFormat )
		 && false == "PNG".equals( videoFormat ) ) {
			return true;
		}

		return false;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		if( null == imageWidth ) {
			return true;
		} else if( imageWidth.longValue() > 500 ) {
			return true;
		}
		if( null == imageHeight ) {
			return true;
		} else if( imageHeight.longValue() > 500 ) {
			return true;
		}

		return false;
	}

	public String toString() {
		return this.getClass().getSimpleName();
	}

}
