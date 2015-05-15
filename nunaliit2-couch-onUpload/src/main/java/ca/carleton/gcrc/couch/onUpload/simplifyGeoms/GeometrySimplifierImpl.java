package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class GeometrySimplifierImpl implements GeometrySimplifier {

	private GeometrySimplificationProcess simplificationProcess;
	
	public GeometrySimplifierImpl(GeometrySimplificationProcess simplificationProcess) {
		this.simplificationProcess = simplificationProcess;
	}

	@Override
	public void simplyGeometry(FileConversionContext conversionContext) throws Exception {
		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		GeometryDescriptor geomDesc = docDescriptor.getGeometryDescription();
		
		// Start simplified object
		JSONObject simplified = new JSONObject();
		
		CouchDbDocumentBuilder builder = new CouchDbDocumentBuilder(docDescriptor.getContext().getDoc());
		
		// Remove attachments with geometries
		for(Attachment att : builder.getAttachments()){
			if( att.getContentType().equals("text/json+nunaliit2_geometry") ){
				builder.removeAttachment(att);
			}
		}
		
		Geometry originalGeometry = geomDesc.getGeometry();
		
		// Original
		{
			WktWriter wktWriter = new WktWriter();
			StringWriter sw = new StringWriter();
			wktWriter.write(originalGeometry, sw);
			String originalWkt = sw.toString();

			JSONObject originalAtt = new JSONObject();
			originalAtt.put("wkt", originalWkt);
			
			String originalName = generateAttachmentName(builder,"nunaliit2_geom_original");
			simplified.put("original", originalName);
			
			builder.addInlineAttachment(originalName, "text/json+nunaliit2_geometry", originalWkt);
		}
		
		GeometrySimplificationReport report = 
			simplificationProcess.simplifyGeometry(originalGeometry);
		JSONObject resolutions = new JSONObject();
		simplified.put("resolutions", resolutions);
		List<GeometrySimplification> simplifications = 
				new ArrayList<GeometrySimplification>(report.getSimplifications());
		Collections.sort(simplifications,new Comparator<GeometrySimplification>(){
			@Override
			public int compare(GeometrySimplification o1,GeometrySimplification o2) {
				if( o1.getResolution() < o2.getResolution() ){
					return -1;
				}
				if( o1.getResolution() > o2.getResolution() ){
					return 1;
				}
				return 0;
			}
		});
		for(GeometrySimplification simplification : simplifications){
			String attName = generateAttachmentName(builder,"nunaliit2_geom_res");
			resolutions.put(attName, simplification.getResolution());

			String wkt = simplification.getGeometry().toString();
			builder.addInlineAttachment(attName, "text/json+nunaliit2_geometry", wkt);
		}
		
		// Set the simplified structure
		geomDesc.setSimplified( simplified );
		
		conversionContext.saveDocument();
	}
	
	private String generateAttachmentName(
			CouchDbDocumentBuilder builder, 
			String prefix
			) throws Exception {
		
		if( false == builder.attachmentExists(prefix) ){
			return prefix;
		}
		
		int count = 1;
		while( count < 100 ){
			String name = prefix + count;
			if( false == builder.attachmentExists(name) ){
				return name;
			}
			
			++count;
		}
		
		throw new Exception("Too many attachments with same prefix: "+prefix);
	}
}
