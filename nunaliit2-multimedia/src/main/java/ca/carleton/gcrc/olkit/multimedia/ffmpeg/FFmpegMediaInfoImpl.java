package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.BufferedReader;
import java.io.File;
import java.io.Reader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FFmpegMediaInfoImpl implements FFmpegMediaInfo {
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	static private Pattern patternInput0 = Pattern.compile("^Input #0,\\s*([^,]*),");
	static private Pattern patternDuration = Pattern.compile("^\\s*Duration:\\s*((\\d+):(\\d+):(\\d+\\.\\d+))");
	static private Pattern patternDurationStart = Pattern.compile("start:\\s*(\\d+\\.\\d+)");
	static private Pattern patternDurationBitRate = Pattern.compile("bitrate:\\s*((\\d+)\\s*([a-zA-Z/]+))");
	static private Pattern patternVideo = Pattern.compile("^\\s*Stream.*Video:\\s*([^, ]*)[^,]*,.*,\\s*(\\d+)x(\\d+)");
	static private Pattern patternAudio = Pattern.compile("^\\s*Stream.*Audio:\\s*([^, ]*)");

	private File file;
	private String fileType = null;
	private String durationString = null;
	private Float durationInSec = null;
	private String startString = null;
	private Float startInSec = null;
	private String bitRateString = null;
	private Long bitRate = null;
	private Long width = null;
	private Long height = null;
	private String audioCodec = null;
	private String videoCodec = null;
	
	public FFmpegMediaInfoImpl() {
	}
	
	public FFmpegMediaInfoImpl(File file) {
		this.file = file;
	}
	
	@Override
	public File getFile() {
		return file;
	}
	
	@Override
	public String getFileType() {
		return fileType;
	}
	
	@Override
	public String getDurationString() {
		return durationString;
	}
	
	@Override
	public Float getDurationInSec() {
		return durationInSec;
	}
	
	@Override
	public String getStartString() {
		return startString;
	}
	
	@Override
	public Float getStartInSec() {
		return startInSec;
	}
	
	@Override
	public String getBitRateString() {
		return bitRateString;
	}
	
	@Override
	public Long getBitRate() {
		return bitRate;
	}
	
	@Override
	public Long getWidth() {
		return width;
	}
	
	@Override
	public Long getHeight() {
		return height;
	}
	
	@Override
	public String getAudioCodec() {
		return audioCodec;
	}
	
	@Override
	public String getVideoCodec() {
		return videoCodec;
	}
	
	public void parseFromFFmpegReader(Reader isr) throws Exception {
		try {
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			boolean inputFound = false;
			while( null != line ) {
				// Ignore lines until we find the start of the movie description 'Input #0'
				if( false == inputFound ) {
					Matcher matcher = patternInput0.matcher(line);
					if( matcher.find() ) {
						inputFound = true;
						fileType = matcher.group(1).trim();
					}
				} else {
					Matcher matcherDuration = patternDuration.matcher(line);
					Matcher matcherVideo = patternVideo.matcher(line);
					Matcher matcherAudio = patternAudio.matcher(line);
	
					if( matcherDuration.find() ) {
						durationString = matcherDuration.group(1);
						int hours = Integer.parseInt( matcherDuration.group(2) );
						int mins = Integer.parseInt( matcherDuration.group(3) );
						float secs = Float.parseFloat( matcherDuration.group(4) );
						durationInSec = new Float( secs + (60.0*mins) + (3600.0*hours));
						
						// On the duration line, there is a "bit rate" value
						Matcher matcherBitRate = patternDurationBitRate.matcher(line);
						if( matcherBitRate.find() ) {
							bitRateString = matcherBitRate.group(1);
							int bitRateValue = Integer.parseInt( matcherBitRate.group(2) );
							String bitRateUnit = matcherBitRate.group(3).trim();
							bitRate = convertBitRate(bitRateValue, bitRateUnit);
						} else {
							bitRateString = null;
							bitRate = new Long(0);
						}
						
						// On the duration line, there is an optional "start" value
						Matcher matcherStart = patternDurationStart.matcher(line);
						if( matcherStart.find() ) {
							startString = matcherStart.group(1);
							startInSec = Float.parseFloat( matcherStart.group(1) );
						} else {
							startString = null;
							startInSec = new Float(0.0);
						}
						
					
					} else if( matcherVideo.find() ) {
						videoCodec = matcherVideo.group(1);
						width = new Long( Long.parseLong( matcherVideo.group(2) ) );
						height = new Long( Long.parseLong( matcherVideo.group(3) ) );
					
					} else if( matcherAudio.find() ) {
						audioCodec = matcherAudio.group(1);
	
					}
				}
				
				line = bufReader.readLine();
			}
		} catch(Exception e) {
			throw new Exception("Error while parsing FFmpeg info", e);
		}
	}

	private Long convertBitRate(int bitRate, String bitRateUnit) {
		Long result = null;
		
		if( "kb/s".equals(bitRateUnit) ) {
			result = new Long( bitRate * 1000 );
		} else if( "b/s".equals(bitRateUnit) ) {
			result = new Long( bitRate );
		} else if( "Mb/s".equalsIgnoreCase(bitRateUnit) ) {
			result = new Long( bitRate * 1000000 );
		}
		
		return result;
	}
}
