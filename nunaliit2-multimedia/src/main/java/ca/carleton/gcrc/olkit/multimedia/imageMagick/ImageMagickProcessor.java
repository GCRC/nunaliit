package ca.carleton.gcrc.olkit.multimedia.imageMagick;

import java.io.File;


public interface ImageMagickProcessor {

	ImageInfo getImageInfo(File imageFile) throws Exception;
	
	void convertImage(File imageFile, File outputFile) throws Exception;
	
	void convertImage(ImageInfo imageInfo, File outputFile) throws Exception;

	void resizeImage(File imageFile, File outputFile, int maxWidth, int maxHeight) throws Exception;
	
	void resizeImage(ImageInfo imageInfo, File outputFile, int maxWidth, int maxHeight) throws Exception;

	void reorientImage(File imageFile, File outputFile) throws Exception;
	
	void reorientImage(ImageInfo imageInfo, File outputFile) throws Exception;
}
