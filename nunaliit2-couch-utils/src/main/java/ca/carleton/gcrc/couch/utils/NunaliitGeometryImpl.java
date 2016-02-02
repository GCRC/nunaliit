package ca.carleton.gcrc.couch.utils;

public class NunaliitGeometryImpl implements NunaliitGeometry {

	private String wkt;

	@Override
	public String getWKT() {
		return wkt;
	}
	
	public void setWKT(String wkt) {
		this.wkt = wkt;
	}
}
