package ca.carleton.gcrc.olkit.multimedia.utils;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;

public class MultimediaTestingProgress implements MultimediaConversionProgress {

	private List<Integer> reportedProgress = new Vector<Integer>();
	
	@Override
	public void updateProgress(int percent) {
		reportedProgress.add( new Integer(percent) );
	}

	public List<Integer> getReportedProgress() {
		return reportedProgress;
	}

}
