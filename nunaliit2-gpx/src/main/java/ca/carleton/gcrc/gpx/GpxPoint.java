package ca.carleton.gcrc.gpx;

import java.math.BigDecimal;
import java.util.Date;

public interface GpxPoint {
	
	public String getName();
	
	public String getDescription();
	
	public BigDecimal getLat();
	
	public BigDecimal getLong();
	
	public BigDecimal getElevation();
	
	public Date getTime();
	
}
