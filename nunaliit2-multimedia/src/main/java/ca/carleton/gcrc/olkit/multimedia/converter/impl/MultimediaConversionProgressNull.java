package ca.carleton.gcrc.olkit.multimedia.converter.impl;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;

public class MultimediaConversionProgressNull implements MultimediaConversionProgress {

	static private MultimediaConversionProgressNull g_singleton = new MultimediaConversionProgressNull();
	
	static public MultimediaConversionProgressNull getSingleton() {
		return g_singleton;
	}
	
	@Override
	public void updateProgress(int percent) {
	}

}
