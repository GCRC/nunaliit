package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;
import ca.carleton.gcrc.utils.CommandUtils;

public class FFmpegProcessorDefault implements FFmpegProcessor {

	static final protected Logger logger = LoggerFactory.getLogger(FFmpegProcessorDefault.class);

	static private Pattern patternTime = Pattern.compile("^\\s*frame=.*time=\\s*(\\d+\\.\\d*)");

	static public String ffmpegInfoCommand = "ffprobe %1$s";
	static public String ffmpegConvertVideoCommand = "ffmpeg -i %1$s -y -acodec libvo_aacenc -ab 48000 -ac 2 -vcodec libx264 -b:v 128000 -r 24 -vf scale=320:-2 -threads 0 -f mp4 %2$s";
	static public String ffmpegConvertAudioCommand = "ffmpeg -i %1$s -y -acodec libmp3lame -ab 48000 -ac 2 -threads 0 -f mp3 %2$s";
	static public String ffmpegCreateThumbnailCommand = "ffmpeg -y -ss %5$s -i %1$s -s %3$dx%4$d -r 1 -vframes 1 -f image2 %2$s";
	static public double ffmpegCreateThumbnailFrameInSec = 5.0;
	
	static String[] breakUpCommand(String command){
		String[] commandTokens = command.split(" ");
		int count = 0;
		for(String token : commandTokens){
			if( token.length() > 0 ) ++count;
		}
		
		String[] tokens = new String[count];
		int index = 0;
		for(String token : commandTokens){
			if( token.length() > 0 ) {
				tokens[index] = token;
				++index;
			}
		}
		
		return tokens;
	}
	
	private MultimediaConversionProgress progressTracker;
	
	public FFmpegProcessorDefault() {
		
	}
	
	public FFmpegProcessorDefault(MultimediaConversionProgress progressTracker) {
		this.progressTracker = progressTracker;
	}
	
	@Override
	public FFmpegMediaInfo getMediaInfo(File mediafile) throws Exception {
		FFmpegMediaInfoImpl info = new FFmpegMediaInfoImpl(mediafile);
		
		Runtime rt = Runtime.getRuntime();
		StringWriter sw = new StringWriter();
		try {
			String[] tokens = breakUpCommand(ffmpegInfoCommand);
			for(int i=0; i<tokens.length; ++i){
				tokens[i] = String.format(tokens[i], mediafile.getAbsolutePath());
				if( 0 != i ) sw.write(" ");
				sw.write(tokens[i]);
			}
			logger.debug(sw.toString());
			Process p = rt.exec(tokens, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			info.parseFromFFmpegReader(isr);
			
			int exitValue = p.waitFor();
			if( 0 != exitValue ){
				logger.debug("Command ("+sw.toString()+") exited with value "+exitValue);
				throw new Exception("Process exited with value: "+exitValue);
			}

		} catch (IOException e) {
			throw new Exception("Error while parsing info on command: "+sw.toString(),e);
		}
		
		return info;
	}

	@Override
	public void convertVideo(File inputFile, File outputFile) throws Exception {
		FFmpegMediaInfo inputVideo = getMediaInfo(inputFile);
		convertVideo(inputVideo, outputFile);
	}
	
	@Override
	public void convertVideo(FFmpegMediaInfo inputVideo, File outputFile) throws Exception {
		
		Runtime rt = Runtime.getRuntime();
		StringWriter sw = new StringWriter();
		try {
			String convertVideoCommand = ffmpegConvertVideoCommand;

			// Conversion needs to regenerate presentation timestamps for firefox (quicktime?)
			// generated webm file. Issue discovered on mac os x firefox 53.0.3
			// https://stackoverflow.com/questions/18123376/webm-to-mp4-conversion-using-ffmpeg
			if(inputVideo.getFileType().equals("matroska") && inputVideo.getVideoCodec().equals("vp8")) {
			    //Add the new flags immediately after the command (either ffmpeg or avconv)
				convertVideoCommand = ffmpegConvertVideoCommand.replaceFirst("(ffmpeg|avconv) ", "$1 -fflags +genpts -r 24 ");
                logger.info("Running new command: " + convertVideoCommand);
			}

			String[] tokens = breakUpCommand(convertVideoCommand);
			for(int i=0; i<tokens.length; ++i){
				tokens[i] = String.format(tokens[i], inputVideo.getFile().getAbsolutePath(), outputFile.getAbsolutePath());
				if( 0 != i ) sw.write(" ");
				sw.write(tokens[i]);
			}
			logger.debug(sw.toString());

			Process p = rt.exec(tokens, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {

				if( null != inputVideo.getDurationInSec() && null != progressTracker ) {
					Matcher matcher = patternTime.matcher(line);
					if( matcher.find() ) {
						float time = Float.parseFloat( matcher.group(1) );
						float percent = time / inputVideo.getDurationInSec().floatValue();
						int percentInt = (int)(percent * 100) + 1;
						if( percentInt > 100 ) {
							percentInt = 100;
						}
						progressTracker.updateProgress(percentInt);
					}
				}
				
				line = bufReader.readLine();
			}
			
			int exitValue = p.waitFor();
			if( 0 != exitValue ){
				logger.info("Command ("+sw.toString()+") exited with value "+exitValue);
				throw new Exception("Process exited with value: "+exitValue);
			}
			
		} catch (IOException e) {
			throw new Exception("Error while converting video: "+sw.toString(),e);
		}
	}

	@Override
	public void convertAudio(File inputFile, File outputFile) throws Exception {
		FFmpegMediaInfo inputVideo = getMediaInfo(inputFile);
		convertAudio(inputVideo, outputFile);
	}
	
	@Override
	public void convertAudio(FFmpegMediaInfo inputVideo, File outputFile) throws Exception {
		
		Runtime rt = Runtime.getRuntime();
		StringWriter sw = new StringWriter();
		try {
			String[] tokens = breakUpCommand(ffmpegConvertAudioCommand);
			for(int i=0; i<tokens.length; ++i){
				tokens[i] = String.format(tokens[i], inputVideo.getFile().getAbsolutePath(), outputFile.getAbsolutePath());
				if( 0 != i ) sw.write(" ");
				sw.write(tokens[i]);
			}
			logger.debug(sw.toString());

			Process p = rt.exec(tokens, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {

				if( null != inputVideo.getDurationInSec() && null != progressTracker ) {
					Matcher matcher = patternTime.matcher(line);
					if( matcher.find() ) {
						float time = Float.parseFloat( matcher.group(1) );
						float percent = time / inputVideo.getDurationInSec().floatValue();
						int percentInt = (int)(percent * 100);
						if( percentInt > 100 ) {
							percentInt = 100;
						}
						progressTracker.updateProgress(percentInt);
					}
				}
				
				line = bufReader.readLine();
			}
			
			int exitValue = p.waitFor();
			if( 0 != exitValue ){
				logger.info("Command ("+sw.toString()+") exited with value "+exitValue);
				throw new Exception("Process exited with value: "+exitValue);
			}

		} catch (IOException e) {
			throw new Exception("Error while converting audio :"+sw.toString(),e);
		}
	}
	
	@Override
	public void createThumbnail(File inputFile, File outputFile, int maxWidth, int maxHeight) throws Exception {
		FFmpegMediaInfo inputVideo = getMediaInfo(inputFile);
		createThumbnail(inputVideo, outputFile, maxWidth, maxHeight);
	}
	
	@Override
	public void createThumbnail(FFmpegMediaInfo inputVideo, File outputFile, int maxWidth, int maxHeight) throws Exception {
		
		// Compute width and height, preserving aspect ratio
		int width = maxWidth;
		int height = maxHeight;
		if( null != inputVideo.getWidth() 
		 && null != inputVideo.getHeight() ){
			long inputHeight = inputVideo.getHeight();
			long inputWidth = inputVideo.getWidth();
			float ratio = (float)inputHeight / (float)inputWidth;
			height = Math.round(width * ratio);
			if( height > maxHeight ){
				height = maxHeight;
				width = (int)(height / ratio);
			}
		}
		
		double timestamp = ffmpegCreateThumbnailFrameInSec;
		if( null == inputVideo.getStartInSec() 
		 && null == inputVideo.getDurationInSec() ){
			timestamp = 0;
		} else if( null == inputVideo.getStartInSec() ){
			if( timestamp > inputVideo.getDurationInSec() ){
				timestamp = inputVideo.getDurationInSec() / 2;
			}
		} else if( null == inputVideo.getDurationInSec() ){
			timestamp = inputVideo.getStartInSec();
		} else {
			if( timestamp > (inputVideo.getStartInSec() + inputVideo.getDurationInSec()) ){
				timestamp = inputVideo.getStartInSec() + (inputVideo.getDurationInSec() / 2);
			}
		}
		String timestampStr = convertTimestampToString(timestamp);
		
		StringWriter sw = new StringWriter();
		try {
			List<String> tokens = CommandUtils.breakUpCommand(ffmpegCreateThumbnailCommand);
			List<String> effectiveTokens = new Vector<String>();
			boolean first = true;
			for(String token : tokens){
				String effectiveToken = String.format(
					token
					,inputVideo.getFile().getAbsolutePath()
					,outputFile.getAbsolutePath()
					,width
					,height
					,timestampStr
					);
				
				effectiveTokens.add(effectiveToken);
				
				if( first ) {
					first = false;
				} else {
					sw.write(" ") ;
				}
				sw.write(effectiveToken);
			}
			logger.debug(sw.toString());

			CommandUtils.executeCommand(effectiveTokens);

		} catch (IOException e) {
			throw new Exception("Error while creating thumbnail: "+sw.toString(),e);
		}
	}

	public String convertTimestampToString(double timestamp) {
		int hours = 0;
		int minutes = 0;
		int seconds = 0;
		int fract = 0;
		
		if( timestamp >= 3600 ){
			hours = (int)(timestamp / 3600);
			timestamp = timestamp % 3600;
		}

		if( timestamp >= 60 ){
			minutes = (int)(timestamp / 60);
			timestamp = timestamp % 60;
		}

		if( timestamp > 0 ){
			seconds = (int)(timestamp);
			timestamp = timestamp - seconds;
		}
		
		fract = (int)(timestamp * 100);
		
		String str = String.format("%1$02d:%2$02d:%3$02d.%4$02d", hours, minutes, seconds, fract);

		return str;
	}
}
