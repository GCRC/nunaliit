package ca.carleton.gcrc.gpx._11;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.gpx.GpxTrack;
import ca.carleton.gcrc.gpx.GpxTrackSegment;

import com.topografix.gpx._1._1.TrkType;
import com.topografix.gpx._1._1.TrksegType;

public class GpxTrack11 implements GpxTrack {

	private TrkType trk;
	private List<GpxTrackSegment> segments;
	
	public GpxTrack11(TrkType trk) {
		this.trk = trk;
		
		// Track Segments
		segments = new Vector<GpxTrackSegment>();
		for(TrksegType s : trk.getTrkseg()) {
			segments.add( new GpxTrackSegment11(s) );
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