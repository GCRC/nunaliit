package ca.carleton.gcrc.gpx;

import java.util.List;

public interface Gpx {
	
	public String getName();
	
	public String getDescription();

	public List<GpxTrack> getTracks();

	public List<GpxWayPoint> getWayPoints();

	public List<GpxRoute> getRoutes();
}
