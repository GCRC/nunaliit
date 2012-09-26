package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.File;

public interface FFmpegProcessor {
	
	FFmpegMediaInfo getMediaInfo(File videoFile) throws Exception;

	void convertVideo(File inputFile, File outputFile) throws Exception;
	
	void convertVideo(FFmpegMediaInfo inputVideo, File outputFile) throws Exception;

	void convertAudio(File inputFile, File outputFile) throws Exception;
	
	void convertAudio(FFmpegMediaInfo inputVideo, File outputFile) throws Exception;
	
	void createThumbnail(File inputFile, File outputFile, int width, int height) throws Exception;
	
	void createThumbnail(FFmpegMediaInfo inputVideo, File outputFile, int width, int height) throws Exception;

}
