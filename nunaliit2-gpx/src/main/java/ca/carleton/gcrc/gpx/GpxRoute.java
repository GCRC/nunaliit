package ca.carleton.gcrc.gpx;

import java.util.List;

public interface GpxRoute {
	
	public String getName();
	
	public String getDescription();

	public List<GpxPoint> getRoutePoints();
}
