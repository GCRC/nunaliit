package ca.carleton.gcrc.gpx._11;

import java.util.ArrayList;
import java.util.List;

import com.topografix.gpx._1._1.TrksegType;
import com.topografix.gpx._1._1.WptType;

import ca.carleton.gcrc.gpx.GpxPoint;
import ca.carleton.gcrc.gpx.GpxTrackSegment;

public class GpxTrackSegment11 implements GpxTrackSegment {

	private TrksegType s;
	
	public GpxTrackSegment11(TrksegType s) {
		this.s = s;
	}

	@Override
	public List<GpxPoint> getPoints() {
		List<WptType> l = s.getTrkpt();
		List<GpxPoint> points = new ArrayList<GpxPoint>(l.size());
		for(WptType p : l) {
			points.add( new GpxWayPoint11(p) );
		}
		return points;
	}

}
