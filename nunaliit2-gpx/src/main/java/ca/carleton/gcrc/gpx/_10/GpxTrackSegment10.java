package ca.carleton.gcrc.gpx._10;

import java.util.ArrayList;
import java.util.List;

import ca.carleton.gcrc.gpx.GpxPoint;
import ca.carleton.gcrc.gpx.GpxTrackSegment;

import com.topografix.gpx._1._0.Gpx.Trk.Trkseg;
import com.topografix.gpx._1._0.Gpx.Trk.Trkseg.Trkpt;

public class GpxTrackSegment10 implements GpxTrackSegment {

	private Trkseg s;
	
	public GpxTrackSegment10(Trkseg s) {
		this.s = s;
	}

	@Override
	public List<GpxPoint> getPoints() {
		List<Trkpt> l = s.getTrkpt();
		List<GpxPoint> points = new ArrayList<GpxPoint>(l.size());
		for(Trkpt p : l) {
			points.add( new GpxTrackPoint10(p) );
		}
		return points;
	}

}
