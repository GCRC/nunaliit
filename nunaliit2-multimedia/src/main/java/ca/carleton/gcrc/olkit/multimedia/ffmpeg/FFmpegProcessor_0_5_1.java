package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import org.apache.log4j.Logger;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;

public class FFmpegProcessor_0_5_1 implements FFmpegProcessor {

	static private Pattern patternTime = Pattern.compile("^\\s*frame=.*time=\\s*(\\d+\\.\\d*)");

	final protected Logger logger = Logger.getLogger(this.getClass());

	private MultimediaConversionProgress ffmpegProgress;
	
	public FFmpegProcessor_0_5_1() {
		
	}
	
	public FFmpegProcessor_0_5_1(MultimediaConversionProgress ffmpegProgress) {
		this.ffmpegProgress = ffmpegProgress;
	}
	
	@Override
	public FFmpegMediaInfo getMediaInfo(File videoFile) throws Exception {
		FFmpegMediaInfoImpl info = new FFmpegMediaInfoImpl(videoFile);
		
		Runtime rt = Runtime.getRuntime();
		try {
			String command = "ffmpeg -i "+videoFile.getAbsolutePath();
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			info.parseFromFFmpegReader(isr);
		} catch (IOException e) {
			throw new Exception("Error while reading info about "+videoFile.getAbsolutePath(),e);
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
		try {
			String command = "ffmpeg -i "+inputVideo.getFile().getAbsolutePath()+" -y -acodec libfaac -ab 48000 -ac 2 -vcodec libx264 -b 128000 -s 320x240 -threads 0 -f mp4 "+outputFile.getAbsolutePath();
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {

				if( null != inputVideo.getDurationInSec() && null != ffmpegProgress ) {
					Matcher matcher = patternTime.matcher(line);
					if( matcher.find() ) {
						float time = Float.parseFloat( matcher.group(1) );
						float percent = time / inputVideo.getDurationInSec().floatValue();
						int percentInt = (int)(percent * 100);
						if( percentInt > 100 ) {
							percentInt = 100;
						}
						ffmpegProgress.updateProgress(percentInt);
					}
				}
				
				line = bufReader.readLine();
			}
		} catch (IOException e) {
			throw new Exception("Error while reading converting "+inputVideo.getFile().getAbsolutePath(),e);
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
		try {
			String command = "ffmpeg -i "+inputVideo.getFile().getAbsolutePath()+" -y -acodec libfaac -ab 48000 -ac 2 -threads 0 -f mp4 "+outputFile.getAbsolutePath();
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {

				if( null != inputVideo.getDurationInSec() && null != ffmpegProgress ) {
					Matcher matcher = patternTime.matcher(line);
					if( matcher.find() ) {
						float time = Float.parseFloat( matcher.group(1) );
						float percent = time / inputVideo.getDurationInSec().floatValue();
						int percentInt = (int)(percent * 100);
						if( percentInt > 100 ) {
							percentInt = 100;
						}
						ffmpegProgress.updateProgress(percentInt);
					}
				}
				
				line = bufReader.readLine();
			}
		} catch (IOException e) {
			throw new Exception("Error while reading converting "+inputVideo.getFile().getAbsolutePath(),e);
		}
	}
	
	@Override
	public void createThumbnail(File inputFile, File outputFile, int width, int height) throws Exception {
		FFmpegMediaInfo inputVideo = getMediaInfo(inputFile);
		createThumbnail(inputVideo, outputFile, width, height);
	}
	
	@Override
	public void createThumbnail(FFmpegMediaInfo inputVideo, File outputFile, int width, int height) throws Exception {
		
		Runtime rt = Runtime.getRuntime();
		try {
			String command = "ffmpeg -i "+inputVideo.getFile().getAbsolutePath()+" -y -ss 00:00:05 -s "+width+"x"+height+" -r 1 -vframes 1 -f image2 "+outputFile.getAbsolutePath();
			rt.exec(command, null, null);
		} catch (IOException e) {
			throw new Exception("Error while creating thumbnail for "+inputVideo.getFile().getAbsolutePath(),e);
		}
	}
}
