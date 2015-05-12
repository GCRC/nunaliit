package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.io.StringWriter;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class GeometrySimplifierImpl implements GeometrySimplifier {

	public GeometrySimplifierImpl() {
		
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
