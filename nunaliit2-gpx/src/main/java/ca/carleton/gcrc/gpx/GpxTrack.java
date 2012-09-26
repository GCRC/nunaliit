package ca.carleton.gcrc.gpx;

import java.util.List;

public interface GpxTrack {

	public String getName();

	public String getDescription();
	
	public List<GpxTrackSegment> getSegments();
}
