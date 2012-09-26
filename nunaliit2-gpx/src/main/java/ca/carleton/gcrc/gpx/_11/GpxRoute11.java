package ca.carleton.gcrc.gpx._11;

import java.util.ArrayList;
import java.util.List;

import com.topografix.gpx._1._1.RteType;
import com.topografix.gpx._1._1.WptType;

import ca.carleton.gcrc.gpx.GpxPoint;
import ca.carleton.gcrc.gpx.GpxRoute;

public class GpxRoute11 implements GpxRoute {

	private RteType route;
	
	public GpxRoute11(RteType route) {
		this.route = route;
	}

	@Override
	public String getName() {
		return route.getName();
	}

	@Override
	public String getDescription() {
		return route.getDesc();
	}

	@Override
	public List<GpxPoint> getRoutePoints() {
		List<WptType> l = route.getRtept();
		List<GpxPoint> points = new ArrayList<GpxPoint>(l.size());
		for(WptType p : l) {
			points.add( new GpxWayPoint11(p) );
		}
		return points;
	}

}
