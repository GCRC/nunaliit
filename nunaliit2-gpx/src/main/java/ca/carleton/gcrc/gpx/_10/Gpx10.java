package ca.carleton.gcrc.gpx._10;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.gpx.GpxRoute;
import ca.carleton.gcrc.gpx.GpxTrack;
import ca.carleton.gcrc.gpx.GpxWayPoint;

import com.topografix.gpx._1._0.Gpx;
import com.topografix.gpx._1._0.Gpx.Rte;
import com.topografix.gpx._1._0.Gpx.Trk;
import com.topografix.gpx._1._0.Gpx.Wpt;

public class Gpx10 implements ca.carleton.gcrc.gpx.Gpx {

	private Gpx gpx;
	private List<GpxTrack> tracks = null;
	private List<GpxRoute> routes = null;
	private List<GpxWayPoint> waypoints = null;
	
	public Gpx10(Gpx gpx) {
		this.gpx = gpx;
		
		// Tracks
		tracks = new Vector<GpxTrack>();
		for(Trk trk : gpx.getTrk()) {
			tracks.add( new GpxTrack10(trk) );
		}
		
		// Way points
		waypoints = new Vector<GpxWayPoint>();
		for(Wpt wp : gpx.getWpt()) {
			waypoints.add( new GpxWayPoint10(wp) );
		}
		
		// Routes
		routes = new Vector<GpxRoute>();
		for(Rte route : gpx.getRte()) {
			routes.add( new GpxRoute10(route) );
		}
	}

	@Override
	public String getName() {
		return gpx.getName();
	}

	@Override
	public String getDescription() {
		return gpx.getDesc();
	}

	@Override
	public List<GpxTrack> getTracks() {
		return tracks;
	}

	@Override
	public List<GpxWayPoint> getWayPoints() {
		return waypoints;
	}

	@Override
	public List<GpxRoute> getRoutes() {
		return routes;
	}
}
