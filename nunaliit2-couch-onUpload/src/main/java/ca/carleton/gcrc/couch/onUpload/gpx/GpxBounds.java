package ca.carleton.gcrc.couch.onUpload.gpx;

import java.math.BigDecimal;

import org.json.JSONArray;

public class GpxBounds {
	private BigDecimal minX = null;
	private BigDecimal minY = null;
	private BigDecimal maxX = null;
	private BigDecimal maxY = null;
	
	public BigDecimal getMinX() {
		return minX;
	}

	public void setMinX(BigDecimal minX) {
		this.minX = minX;
	}

	public BigDecimal getMinY() {
		return minY;
	}

	public void setMinY(BigDecimal minY) {
		this.minY = minY;
	}

	public BigDecimal getMaxX() {
		return maxX;
	}

	public void setMaxX(BigDecimal maxX) {
		this.maxX = maxX;
	}

	public BigDecimal getMaxY() {
		return maxY;
	}

	public void setMaxY(BigDecimal maxY) {
		this.maxY = maxY;
	}

	public void expandToInclude(BigDecimal x, BigDecimal y) {
		if( null == minX ) {
			minX = x;
		} else if( minX.compareTo( x ) > 0 ) {
			minX = x;
		}
		if( null == maxX ) {
			maxX = x;
		} else if( maxX.compareTo( x ) < 0 ) {
			maxX = x;
		}
		if( null == minY ) {
			minY = y;
		} else if( minY.compareTo( y ) > 0 ) {
			minY = y;
		}
		if( null == maxY ) {
			maxY = y;
		} else if( maxY.compareTo( y ) < 0 ) {
			maxY = y;
		}
	}
	
	public JSONArray asJSONArray() {
		JSONArray bbox = null;

		if( null != minX 
		 && null != minY 
		 && null != maxX 
		 && null != maxY ) {
			bbox = new JSONArray();
	
			bbox.put(minX);
			bbox.put(minY);
			bbox.put(maxX);
			bbox.put(maxY);
		}
		
		return bbox;
	}
}
