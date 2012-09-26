package ca.carleton.gcrc.olkit.multimedia.converter;


public interface MultimediaConverter {

	void convertVideo(MultimediaConversionRequest request) throws Exception;

	void convertAudio(MultimediaConversionRequest request) throws Exception;

	void convertImage(MultimediaConversionRequest request) throws Exception;

	void createImageThumbnail(MultimediaConversionRequest request) throws Exception;

}
