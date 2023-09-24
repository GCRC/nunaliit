package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.StringWriter;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.wkt.WktParser;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class GeometryDescriptor extends AbstractDescriptor {

	private DocumentDescriptor documentDescriptor;

	public GeometryDescriptor(DocumentDescriptor documentDescriptor){
		this.documentDescriptor = documentDescriptor;
	}

	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject doc = documentDescriptor.getJson();
		return doc.getJSONObject(UploadConstants.KEY_DOC_GEOMETRY);
	}

	public Geometry getGeometry() throws Exception {
		Geometry geom = null;
		
		JSONObject geomObj = getJson();
		String wkt = geomObj.optString("wkt", null);
		
		WktParser parser = new WktParser();
		geom = parser.parseWkt(wkt);
		
		return geom;
	}
	
	public void setGeometry(Geometry geom) throws Exception {
		WktWriter wktWriter = new WktWriter();
		StringWriter sw = new StringWriter();
		wktWriter.write(geom, sw);
		String wkt = sw.toString();
		
		JSONObject geomObj = getJson();
		
		geomObj.put("wkt", wkt);
		
		BoundingBox bbox = geom.getBoundingBox();
		setBoundingBox(bbox);
	}
	
	public void setGeometryAsWkt(String wkt) throws Exception {
		WktParser parser = new WktParser();
		Geometry geom = parser.parseWkt(wkt);

		JSONObject geomObj = getJson();
		
		geomObj.put("wkt", wkt);
		
		BoundingBox bbox = geom.getBoundingBox();
		setBoundingBox(bbox);
	}
	
	public BoundingBox getBoundingBox() throws Exception {
		BoundingBox result = null;
		
		JSONObject geomObj = getJson();
		
		JSONArray bbox = geomObj.optJSONArray("bbox");
		if( null != bbox 
		 && bbox.length() > 3 ){
			double xmin = bbox.getDouble(0);
			double ymin = bbox.getDouble(1);
			double xmax = bbox.getDouble(2);
			double ymax = bbox.getDouble(3);
			result = new BoundingBox(xmin,ymin,xmax,ymax);
		}
		
		return result;
	}

	public void setBoundingBox(BoundingBox bbox) throws Exception {
		JSONObject geomObj = getJson();
		
		JSONArray bboxArray = new JSONArray();
		bboxArray.put(bbox.getMinX());
		bboxArray.put(bbox.getMinY());
		bboxArray.put(bbox.getMaxX());
		bboxArray.put(bbox.getMaxY());
		geomObj.put("bbox", bboxArray);
	}
	
	public void setSimplified(JSONObject simplified) throws Exception {
		JSONObject nunaliit_geom = getJson();
		
		if( null == simplified ){
			Object obj = nunaliit_geom.opt("simplified");
			if( null != obj ){
				nunaliit_geom.remove("simplified");
			}
		} else {
			nunaliit_geom.put("simplified", simplified);
		}
	}
}
