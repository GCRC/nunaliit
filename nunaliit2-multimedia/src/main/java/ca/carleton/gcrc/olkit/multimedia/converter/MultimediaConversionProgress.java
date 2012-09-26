package ca.carleton.gcrc.olkit.multimedia.converter;

public interface MultimediaConversionProgress {

	/**
	 * This function is called to update the status on the
	 * multimedia conversion.
	 * @param percent Integer from 0 to 100, representing the progress
	 * of the conversion.
	 */
	public void updateProgress(int percent);
}
