package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.StringWriter;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class GeometryDescriptor extends AbstractDescriptor {

	private FileConversionContext context;

	public GeometryDescriptor(FileConversionContext context){
		this.context = context;
	}

	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject doc = context.getDoc();
		return doc.getJSONObject(UploadConstants.GEOMETRY_KEY);
	}

	@Override
	protected void setSavingRequired(boolean flag) {
		context.setSavingRequired(flag);
	}
	
	public void setGeometry(Geometry geom) throws Exception {
		WktWriter wktWriter = new WktWriter();
		StringWriter sw = new StringWriter();
		wktWriter.write(geom, sw);
		String wkt = sw.toString();
		
		BoundingBox bbox = geom.getBoundingBox();
		
		JSONObject geomObj = getJson();
		
		geomObj.put("wkt", wkt);
		
		JSONArray bboxArray = new JSONArray();
		bboxArray.put(bbox.getMinX());
		bboxArray.put(bbox.getMinY());
		bboxArray.put(bbox.getMaxX());
		bboxArray.put(bbox.getMaxY());
		geomObj.put("bbox", bboxArray);
		
		setSavingRequired(true);
	}
}
