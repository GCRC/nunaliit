package ca.carleton.gcrc.couch.onUpload.conversion;

import java.io.StringWriter;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
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
	}
}
