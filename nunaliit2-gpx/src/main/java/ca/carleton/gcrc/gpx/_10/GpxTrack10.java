package ca.carleton.gcrc.gpx._10;

import java.util.List;
import java.util.Vector;

import com.topografix.gpx._1._0.Gpx.Trk;
import com.topografix.gpx._1._0.Gpx.Trk.Trkseg;

import ca.carleton.gcrc.gpx.GpxTrack;
import ca.carleton.gcrc.gpx.GpxTrackSegment;

public class GpxTrack10 implements GpxTrack {

	private Trk trk;
	private List<GpxTrackSegment> segments;
	
	public GpxTrack10(Trk trk) {
		this.trk = trk;
		
		// Track Segments
		segments = new Vector<GpxTrackSegment>();
		for(Trkseg s : trk.getTrkseg()) {
			segments.add( new GpxTrackSegment10(s) );
		}
	}

	@Override
	public String getName() {
		return trk.getName();
	}

	@Override
	public String getDescription() {
		return trk.getDesc();
	}

	@Override
	public List<GpxTrackSegment> getSegments() {
		return segments;
	}
	
}
