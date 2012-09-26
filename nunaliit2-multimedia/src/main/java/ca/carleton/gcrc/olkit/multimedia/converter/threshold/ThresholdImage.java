package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

public class ThresholdImage implements MultimediaConversionThreshold {

	static final protected Logger logger = Logger.getLogger(ThresholdImage.class);

	static public ThresholdImage parseString(String s) {
		String[] components = s.split(",");
		if( 2 == components.length ) {
			String format = null;
			Long size = null;
			
			if( false == "*".equals( components[0].trim() ) ) {
				format = components[0].trim();
			}
			
			if( false == "*".equals( components[1].trim() ) ) {
				size = Long.parseLong( components[1].trim() );
			}
			
			return new ThresholdImage(format, size, size);
			
		} else {
			logger.error("Unable to parse image conversion threshold: "+s);
			return null;
		}
	}
	
	private String format = null;
	private Long width = null;
	private Long height = null;
	
	public ThresholdImage(String format, Long width, Long height) {
		this.format = format;
		this.width = width;
		this.height = height;
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

		if( isResizeRequired(imageWidth,imageHeight) ) {
			return true;
		}
		
		if( null != format ) {
			if( false == format.equals( videoFormat ) ) {
				return true;
			}
		}
		
		return false;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {
		
		if( null != width ) {
			if( null == imageWidth ) {
				return true;
			} else if( imageWidth.longValue() > width.longValue() ) {
				return true;
			}
		}
		
		if( null != height ) {
			if( null == imageHeight ) {
				return true;
			} else if( imageHeight.longValue() > height.longValue() ) {
				return true;
			}
		}
		
		return false;
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("image(");

		if( null != format ) {
			pw.print( format );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != width ) {
			pw.print( width );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != height ) {
			pw.print( height );
		} else {
			pw.print( "*" );
		}
		
		pw.print(")");
		
		pw.flush();
		
		return sw.toString();
	}
}
