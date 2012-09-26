package ca.carleton.gcrc.gpx._11;

import java.math.BigDecimal;
import java.util.Date;

import com.topografix.gpx._1._1.WptType;

import ca.carleton.gcrc.gpx.GpxPoint;
import ca.carleton.gcrc.gpx.GpxWayPoint;

public class GpxWayPoint11 implements GpxWayPoint,GpxPoint {

	private WptType wp;
	
	public GpxWayPoint11(WptType wp) {
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
