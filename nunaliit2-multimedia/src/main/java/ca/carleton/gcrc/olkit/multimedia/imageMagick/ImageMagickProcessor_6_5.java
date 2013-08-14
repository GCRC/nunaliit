package ca.carleton.gcrc.olkit.multimedia.imageMagick;

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

public class ImageMagickProcessor_6_5 implements ImageMagickProcessor {

	static private Pattern patternInfoGeometry = Pattern.compile("^\\s*Geometry:\\s*(\\d+)x(\\d+)");
	static private Pattern patternInfoFormat = Pattern.compile("^\\s*Format:\\s*([^\\s]+)");
	static private Pattern patternInfoExifOrientation = Pattern.compile("^\\s*exif:Orientation:\\s*([\\d]+)");
	static private Pattern patternInfoOrientation = Pattern.compile("^\\s*Orientation:\\s*([^\\s]+)");
	static private Pattern patternProgressLoad = Pattern.compile("^\\s*Load\\s+image:\\s*(\\d+)%");
	static private Pattern patternProgressResize = Pattern.compile("^\\s*Resize\\s+image:\\s*(\\d+)%");
	static private Pattern patternProgressRotate = Pattern.compile("^\\s*Rotate\\s+image:\\s*(\\d+)%");
	static private Pattern patternProgressSave = Pattern.compile("^\\s*Save\\s+image:\\s*(\\d+)%");

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private MultimediaConversionProgress imageMagickProgress;
	
	public ImageMagickProcessor_6_5() {
		
	}
	
	public ImageMagickProcessor_6_5(MultimediaConversionProgress imageMagickProgress) {
		this.imageMagickProgress = imageMagickProgress;
	}
	
	public ImageInfo getImageInfo(File imageFile) throws Exception {
		ImageInfo info = new ImageInfo();
		info.file = imageFile;
		
		Runtime rt = Runtime.getRuntime();
		try {
			String command = String.format(
					ImageMagickProcessorDefault.imageInfoCommand
					,imageFile.getAbsolutePath()
					);
			logger.debug(command);
			Process p = rt.exec(command, null, null);
			InputStream is = p.getInputStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {

				Matcher matcherGeometry = patternInfoGeometry.matcher(line);
				Matcher matcherFormat = patternInfoFormat.matcher(line);
				Matcher matcherExifOrientation = patternInfoExifOrientation.matcher(line);
				Matcher matcherOrientation = patternInfoOrientation.matcher(line);
				
				if( matcherGeometry.find() ) {
					info.width = Integer.parseInt( matcherGeometry.group(1) );
					info.height = Integer.parseInt( matcherGeometry.group(2) );
					
				} else if( matcherFormat.find() ) {
					info.format = matcherFormat.group(1);
					
				} else if( matcherExifOrientation.find() ) {
					int orientation = Integer.parseInt( matcherExifOrientation.group(1) );
					if( 1 == orientation ) {
						info.orientation = ImageInfo.Orientation.CORRECT;
					} else {
						info.orientation = ImageInfo.Orientation.REQUIRES_CONVERSION;
					};
					
				} else if( matcherOrientation.find() ) {
					String orientation = matcherOrientation.group(1);
					if( true == "TopLeft".equalsIgnoreCase(orientation) ) {
						info.orientation = ImageInfo.Orientation.CORRECT;
					} else {
						info.orientation = ImageInfo.Orientation.REQUIRES_CONVERSION;
					};
				}
				
				line = bufReader.readLine();
			}
		} catch (IOException e) {
			throw new Exception("Unabel to determine image info",e);
		}
		
		return info;
	}
	
	@Override
	public void convertImage(File imageFile, File outputFile) throws Exception {
		ImageInfo imageInfo = getImageInfo(imageFile);
		convertImage(imageInfo, outputFile);
	}
	
	@Override
	public void convertImage(ImageInfo imageInfo, File outputFile) throws Exception {
		
		Runtime rt = Runtime.getRuntime();
		try {
			String command = String.format(
					ImageMagickProcessorDefault.imageConvertCommand
					,imageInfo.file.getAbsolutePath()
					,outputFile.getAbsolutePath()
					);
			logger.debug(command);
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {
				line = line.trim();

				if( null != imageMagickProgress ) {
					Matcher matcherLoad = patternProgressLoad.matcher(line);
					Matcher matcherResize = patternProgressResize.matcher(line);
					Matcher matcherSave = patternProgressSave.matcher(line);
					
					if( matcherLoad.find() ) {
						int value = Integer.parseInt( matcherLoad.group(1) );
						int percent = value / 3;
						imageMagickProgress.updateProgress(percent);
						
					} else if( matcherResize.find() ) {
						int value = Integer.parseInt( matcherResize.group(1) );
						int percent = (value+100) / 3;
						imageMagickProgress.updateProgress(percent);
						
					} else if( matcherSave.find() ) {
						int value = Integer.parseInt( matcherSave.group(1) );
						int percent = (value+1+200) / 3;
						if( percent > 100 ) {
							percent = 100;
						}
						imageMagickProgress.updateProgress(percent);
					}
				}
				
				line = bufReader.readLine();
			}
		} catch (IOException e) {
			throw new Exception("Error while converting image "+imageInfo.file.getAbsolutePath(),e);
		}
	}

	@Override
	public void resizeImage(File imageFile, File outputFile, int maxWidth, int maxHeight) throws Exception {
		ImageInfo imageInfo = getImageInfo(imageFile);
		resizeImage(imageInfo, outputFile, maxWidth, maxHeight);
	}
	
	@Override
	public void resizeImage(ImageInfo imageInfo, File outputFile, int maxWidth, int maxHeight) throws Exception {
		
		Runtime rt = Runtime.getRuntime();
		try {
			String command = String.format(
					ImageMagickProcessorDefault.imageResizeCommand
					,imageInfo.file.getAbsolutePath()
					,outputFile.getAbsolutePath()
					,maxWidth,maxHeight
					);
			logger.debug(command);
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {
				line = line.trim();

				if( null != imageMagickProgress ) {
					Matcher matcherLoad = patternProgressLoad.matcher(line);
					Matcher matcherResize = patternProgressResize.matcher(line);
					Matcher matcherSave = patternProgressSave.matcher(line);
					
					if( matcherLoad.find() ) {
						int value = Integer.parseInt( matcherLoad.group(1) );
						int percent = value / 3;
						imageMagickProgress.updateProgress(percent);
						
					} else if( matcherResize.find() ) {
						int value = Integer.parseInt( matcherResize.group(1) );
						int percent = (value+100) / 3;
						imageMagickProgress.updateProgress(percent);
						
					} else if( matcherSave.find() ) {
						int value = Integer.parseInt( matcherSave.group(1) );
						int percent = (value+1+200) / 3;
						if( percent > 100 ) {
							percent = 100;
						}
						imageMagickProgress.updateProgress(percent);
					}
				}
				
				line = bufReader.readLine();
			}
		} catch (IOException e) {
			throw new Exception("Error while converting image "+imageInfo.file.getAbsolutePath(),e);
		}
	}


	@Override
	public void reorientImage(File imageFile, File outputFile) throws Exception {
		ImageInfo imageInfo = getImageInfo(imageFile);
		reorientImage(imageInfo, outputFile);
	}

	@Override
	public void reorientImage(
		ImageInfo imageInfo
		,File outputFile
		) throws Exception {
		
		Runtime rt = Runtime.getRuntime();
		try {
			String command = String.format(
					ImageMagickProcessorDefault.imageReorientCommand
					,imageInfo.file.getAbsolutePath()
					,outputFile.getAbsolutePath()
					);
			logger.debug(command);
			Process p = rt.exec(command, null, null);
			InputStream is = p.getErrorStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader bufReader = new BufferedReader(isr);
			String line = bufReader.readLine();
			while( null != line ) {
				line = line.trim();

				if( null != imageMagickProgress ) {
					Matcher matcherLoad = patternProgressLoad.matcher(line);
					Matcher matcherRotate = patternProgressRotate.matcher(line);
					Matcher matcherSave = patternProgressSave.matcher(line);
					
					if( matcherLoad.find() ) {
						int value = Integer.parseInt( matcherLoad.group(1) );
						int percent = value / 3;
						imageMagickProgress.updateProgress(percent);
						
					} else if( matcherRotate.find() ) {
						int value = Integer.parseInt( matcherRotate.group(1) );
						int percent = (value+100) / 3;
						imageMagickProgress.updateProgress(percent);
						
					} else if( matcherSave.find() ) {
						int value = Integer.parseInt( matcherSave.group(1) );
						int percent = (value+1+200) / 3;
						if( percent > 100 ) {
							percent = 100;
						}
						imageMagickProgress.updateProgress(percent);
					}
				}
				
				line = bufReader.readLine();
			}
		} catch (IOException e) {
			throw new Exception("Error while re-orienting image "+imageInfo.file.getAbsolutePath(),e);
		}
	}
}
