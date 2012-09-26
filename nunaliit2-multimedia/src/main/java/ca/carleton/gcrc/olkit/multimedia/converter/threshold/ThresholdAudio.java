package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class ThresholdAudio implements MultimediaConversionThreshold {

	static final protected Logger logger = Logger.getLogger(ThresholdImage.class);

	static public ThresholdAudio parseString(String s) {
		String[] components = s.split(",");
		if( 2 == components.length ) {
			String format = null;
			Long bitrate = null;
			
			if( false == "*".equals( components[0].trim() ) ) {
				format = components[0].trim();
			}
			
			if( false == "*".equals( components[1].trim() ) ) {
				bitrate = Long.parseLong( components[1].trim() );
			}
			
			return new ThresholdAudio(format, bitrate);
			
		} else {
			logger.error("Unable to parse image conversion threshold: "+s);
			return null;
		}
	}
	
	private String format = null;
	private Long bitrate = null;
	
	public ThresholdAudio(String format, Long bitrate) {
		this.format = format;
		this.bitrate = bitrate;
	}
	
	@Override
	public boolean isConversionRequired(
			String videoFormat
			,Long videoRate
			,String audioFormat
			,Long audioRate
			,Long imageWidth
			,Long imageHeight
			) {

		if( null != format ) {
			if( false == format.equals( audioFormat ) ) {
				return true;
			}
		}

		if( null != bitrate ) {
			if( null == audioRate ) {
				return true;
			} else if( audioRate.longValue() > bitrate.longValue() ) {
				return true;
			}
		}
		
		return false;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		return false;
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("audio(");

		if( null != format ) {
			pw.print( format );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != bitrate ) {
			pw.print( bitrate );
		} else {
			pw.print( "*" );
		}
		
		pw.print(")");
		
		pw.flush();
		
		return sw.toString();
	}
}
