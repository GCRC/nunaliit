package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;

public class FFmpegProcessorDefault implements FFmpegProcessor {

	static final protected Logger logger = LoggerFactory.getLogger(FFmpegProcessorDefault.class);

	static private Pattern patternTime = Pattern.compile("^\\s*frame=.*time=\\s*(\\d+\\.\\d*)");

	static public String ffmpegInfoCommand = "avprobe %1$s";
	static public String ffmpegConvertVideoCommand = "avconv -i %1$s -y -acodec libvo_aacenc -ab 48000 -ac 2 -vcodec libx264 -b 128000 -s 320x240 -threads 0 -f mp4 %2$s";
	static public String ffmpegConvertAudioCommand = "avconv -i %1$s -y -acodec libmp3lame -ab 48000 -ac 2 -threads 0 -f mp3 %2$s";
	static public String ffmpegCreateThumbnailCommand = "avconv -y -ss 00:00:05 -i %1$s -s %3$dx%4$d -r 1 -vframes 1 -f image2 %2$s";
	
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
		String command = null;
		try {
			//command = "ffmpeg -i "+mediafile.getAbsolutePath();
			command = String.format(ffmpegInfoCommand, mediafile.getAbsolutePath());
			logger.debug(command);
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			info.parseFromFFmpegReader(isr);
		} catch (IOException e) {
			throw new Exception("Error while parsing info on command: "+command,e);
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
		String command = null;
		try {
			//command = "ffmpeg -i "+inputVideo.file.getAbsolutePath()+" -y -acodec libfaac -ab 48000 -ac 2 -vcodec libx264 -b 128000 -s 320x240 -threads 0 -f mp4 "+outputFile.getAbsolutePath();
			command = String.format(ffmpegConvertVideoCommand, inputVideo.getFile().getAbsolutePath(), outputFile.getAbsolutePath());
			
			logger.debug(command);
			Process p = rt.exec(command, null, null);
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
		} catch (IOException e) {
			throw new Exception("Error while converting video: "+command,e);
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
		String command = null;
		try {
			//command = "ffmpeg -i "+inputVideo.file.getAbsolutePath()+" -y -acodec libfaac -ab 48000 -ac 2 -threads 0 -f mp4 "+outputFile.getAbsolutePath();
			command = String.format(ffmpegConvertAudioCommand, inputVideo.getFile().getAbsolutePath(), outputFile.getAbsolutePath());
			logger.debug(command);
			Process p = rt.exec(command, null, null);
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
		} catch (IOException e) {
			throw new Exception("Error while converting audio :"+command,e);
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
		
		Runtime rt = Runtime.getRuntime();
		String command = null;
		try {
			//command = "ffmpeg -i "+inputVideo.file.getAbsolutePath()+" -y -ss 00:00:05 -s 80x60 -r 1 -vframes 1 -f image2 "+outputFile.getAbsolutePath();
			command = String.format(
				ffmpegCreateThumbnailCommand
				,inputVideo.getFile().getAbsolutePath()
				,outputFile.getAbsolutePath()
				,width
				,height
				);
			logger.debug(command);
			Process p = rt.exec(command, null, null);
			p.waitFor();
		} catch (IOException e) {
			throw new Exception("Error while creating thumbnail: "+command,e);
		}
	}
}
