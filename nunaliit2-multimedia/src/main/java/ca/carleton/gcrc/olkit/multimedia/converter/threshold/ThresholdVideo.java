package ca.carleton.gcrc.olkit.multimedia.converter.threshold;

import java.io.PrintWriter;
import java.io.StringWriter;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionThreshold;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ThresholdVideo implements MultimediaConversionThreshold {

	static final protected Logger logger = LoggerFactory.getLogger(ThresholdVideo.class);

	static public ThresholdVideo parseString(String s) {
		String videoFormat = null;
		Long videoBitrate = null;
		String audioFormat = null;
		Long audioBitrate = null;
		Long size = null;
		
		String[] components = s.split(",");
		if( components.length != 5 ) {
			logger.error("Unable to parse image conversion threshold: "+s);
			return null;

		} else {
			// video
			if( false == "*".equals( components[0].trim() ) ) {
				videoFormat = components[0].trim();
			}
			
			if( false == "*".equals( components[1].trim() ) ) {
				videoBitrate = Long.parseLong( components[1].trim() );
			}
			
			// audio
			if( false == "*".equals( components[2].trim() ) ) {
				audioFormat = components[2].trim();
			}
			
			if( false == "*".equals( components[3].trim() ) ) {
				audioBitrate = Long.parseLong( components[3].trim() );
			}
					
			// image
			if( false == "*".equals( components[4].trim() ) ) {
				size = Long.parseLong( components[4].trim() );
			}
		}

		return new ThresholdVideo(videoFormat, videoBitrate, audioFormat, audioBitrate, size, size);
	}
	
	private String videoFormat = null;
	private Long videoBitrate = null;
	private String audioFormat = null;
	private Long audioBitrate = null;
	private Long width = null;
	private Long height = null;
	
	public ThresholdVideo(
			String videoFormat
			,Long videoBitrate
			,String audioFormat
			,Long audioBitrate
			,Long width
			,Long height
			) {
		this.videoFormat = videoFormat;
		this.videoBitrate = videoBitrate;
		this.audioFormat = audioFormat;
		this.audioBitrate = audioBitrate;
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

		if( null != this.videoFormat ) {
			if( false == this.videoFormat.equals( videoFormat ) ) {
				return true;
			}
		}

		if( null != this.videoBitrate ) {
			if( null == videoRate ) {
				return true;
			} else if( videoRate.longValue() > this.videoBitrate.longValue() ) {
				return true;
			}
		}

		if( null != this.audioFormat ) {
			if( false == this.audioFormat.equals( audioFormat ) ) {
				return true;
			}
		}

		if( null != this.audioBitrate ) {
			if( null == audioRate ) {
				return true;
			} else if( audioRate.longValue() > this.audioBitrate.longValue() ) {
				return true;
			}
		}

		if( isResizeRequired(imageWidth,imageHeight) ) {
			return true;
		}
		
		return false;
	}

	@Override
	public boolean isResizeRequired(Long imageWidth, Long imageHeight) {

		if( null != this.width ) {
			if( null == imageWidth ) {
				return true;
			} else if( imageWidth.longValue() > this.width.longValue() ) {
				return true;
			}
		}
		
		if( null != this.height ) {
			if( null == imageHeight ) {
				return true;
			} else if( imageHeight.longValue() > this.height.longValue() ) {
				return true;
			}
		}
		
		return false;
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("video(");

		if( null != videoFormat ) {
			pw.print( videoFormat );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != videoBitrate ) {
			pw.print( videoBitrate );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != audioFormat ) {
			pw.print( audioFormat );
		} else {
			pw.print( "*" );
		}
		
		pw.print(",");

		if( null != audioBitrate ) {
			pw.print( audioBitrate );
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
