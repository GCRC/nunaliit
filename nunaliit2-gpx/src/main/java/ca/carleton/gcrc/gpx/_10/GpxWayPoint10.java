package ca.carleton.gcrc.gpx._10;

import java.math.BigDecimal;
import java.util.Date;

import com.topografix.gpx._1._0.Gpx.Wpt;

import ca.carleton.gcrc.gpx.GpxWayPoint;

public class GpxWayPoint10 implements GpxWayPoint {

	private Wpt wp;
	
	public GpxWayPoint10(Wpt wp) {
		this.wp = wp;
	}

	@Override
	public String getName() {
		return wp.getName();
	}

	@Override
	public String getDescription() {
		return wp.getDesc();
	}

	@Override
	public BigDecimal getLat() {
		return wp.getLat();
	}

	@Override
	public BigDecimal getLong() {
		return wp.getLon();
	}

	@Override
	public BigDecimal getElevation() {
		return wp.getEle();
	}

	@Override
	public Date getTime() {
		Date result = null;
		if( null != wp.getTime() ) {
			result = wp.getTime().toGregorianCalendar().getTime();
		}
		return result;
	}
}
