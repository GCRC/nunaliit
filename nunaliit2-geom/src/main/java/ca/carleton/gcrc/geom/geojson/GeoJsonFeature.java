package ca.carleton.gcrc.geom.geojson;

import org.json.JSONObject;

import ca.carleton.gcrc.geom.Geometry;

public class GeoJsonFeature implements Feature {

	private String id;
	private Geometry geometry;
	private JSONObject properties;
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	
	public Geometry getGeometry() {
		return geometry;
	}
	public void setGeometry(Geometry geometry) {
		this.geometry = geometry;
	}
	
	public JSONObject getProperties() {
		return properties;
	}
	public void setProperties(JSONObject properties) {
		this.properties = properties;
	}
	
}
