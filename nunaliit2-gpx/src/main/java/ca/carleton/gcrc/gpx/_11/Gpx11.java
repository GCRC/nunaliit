package ca.carleton.gcrc.gpx._11;

import java.util.List;
import java.util.Vector;

import com.topografix.gpx._1._1.GpxType;
import com.topografix.gpx._1._1.MetadataType;
import com.topografix.gpx._1._1.RteType;
import com.topografix.gpx._1._1.TrkType;
import com.topografix.gpx._1._1.WptType;

import ca.carleton.gcrc.gpx.GpxRoute;
import ca.carleton.gcrc.gpx.GpxTrack;
import ca.carleton.gcrc.gpx.GpxWayPoint;

public class Gpx11 implements ca.carleton.gcrc.gpx.Gpx {

	private GpxType gpx;
	private List<GpxTrack> tracks = new Vector<GpxTrack>();
	private List<GpxRoute> routes = new Vector<GpxRoute>();
	private List<GpxWayPoint> waypoints = new Vector<GpxWayPoint>();
	
	public Gpx11(GpxType gpx) {
		this.gpx = gpx;
		
		// Tracks
		tracks = new Vector<GpxTrack>();
		for(TrkType trk : gpx.getTrk()) {
			tracks.add( new GpxTrack11(trk) );
		}
		
		// Way Points
		waypoints = new Vector<GpxWayPoint>();
		for(WptType wp : gpx.getWpt()) {
			waypoints.add( new GpxWayPoint11(wp) );
		}
		
		// Routes
		routes = new Vector<GpxRoute>();
		for(RteType route : gpx.getRte()) {
			routes.add( new GpxRoute11(route) );
		}
	}

	@Override
	public String getName() {
		String result = null;
		MetadataType md = gpx.getMetadata();
		if( null != md ) {
			result = md.getName();
		}
		return result;
	}

	@Override
	public String getDescription() {
		String result = null;
		MetadataType md = gpx.getMetadata();
		if( null != md ) {
			result = md.getDesc();
		}
		return result;
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
