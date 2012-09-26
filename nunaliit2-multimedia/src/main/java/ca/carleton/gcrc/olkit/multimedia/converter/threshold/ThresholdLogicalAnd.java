package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class ThresholdLogicalAnd implements MultimediaConversionThreshold {

	private List<MultimediaConversionThreshold> children = new Vector<MultimediaConversionThreshold>(); 
	
	public void addThreshold(MultimediaConversionThreshold threshold) {
		children.add(threshold);
	}
	
	@Override
	public boolean isConversionRequired(String videoFormat, Long videoRate,
			String audioFormat, Long audioRate, Long imageWidth,
			Long imageHeight) {

		for(MultimediaConversionThreshold child : children) {
			if( false == child.isConversionRequired(videoFormat, videoRate, audioFormat, audioRate, imageWidth, imageHeight) ) {
				return false;
			}
		}
		
		return true;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		for(MultimediaConversionThreshold child : children) {
			if( false == child.isResizeRequired(imageWidth, imageHeight) ) {
				return false;
			}
		}
		
		return true;
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("and[");

		boolean first = true;
		for(MultimediaConversionThreshold child : children) {
			if( first ) {
				first = false;
			} else {
				pw.print("|");
			}
			pw.print( child.toString() );
		}
		
		pw.print("]");
		
		pw.flush();
		
		return sw.toString();
	}
}
