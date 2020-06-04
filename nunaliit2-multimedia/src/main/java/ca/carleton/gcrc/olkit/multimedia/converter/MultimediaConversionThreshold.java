package ca.carleton.gcrc.olkit.multimedia.converter;

public interface MultimediaConversionThreshold
{
	boolean isConversionRequired(String videoFormat, Long videoRate, String audioFormat, Long audioRate,
								 Long imageWidth, Long imageHeight, Long fileSizeMb);

	boolean isResizeRequired(Long imageWidth, Long imageHeight);
}
