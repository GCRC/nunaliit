package ca.carleton.gcrc.gpx._10;

import java.util.ArrayList;
import java.util.List;

import com.topografix.gpx._1._0.Gpx.Rte;
import com.topografix.gpx._1._0.Gpx.Rte.Rtept;

import ca.carleton.gcrc.gpx.GpxPoint;
import ca.carleton.gcrc.gpx.GpxRoute;

public class GpxRoute10 implements GpxRoute {

	private Rte route;
	
	public GpxRoute10(Rte route) {
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
		List<Rtept> l = route.getRtept();
		List<GpxPoint> points = new ArrayList<GpxPoint>(l.size());
		for(Rtept p : l) {
			points.add( new GpxRoutePoint10(p) );
		}
		return points;
	}

}
