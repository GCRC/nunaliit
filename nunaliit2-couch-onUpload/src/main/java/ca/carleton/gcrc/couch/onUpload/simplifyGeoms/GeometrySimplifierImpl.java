package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.io.StringWriter;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.GeometryDescriptor;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class GeometrySimplifierImpl implements GeometrySimplifier {

	private GeometrySimplificationProcess simplificationProcess;
	
	public GeometrySimplifierImpl(GeometrySimplificationProcess simplificationProcess) {
		this.simplificationProcess = simplificationProcess;
	}

	@Override
	public void simplifyGeometry(FileConversionContext conversionContext) throws Exception {
		DocumentDescriptor docDescriptor = conversionContext.getDocument();
		GeometryDescriptor geomDesc = docDescriptor.getGeometryDescription();
		
		// Create a geometry attachment name prefix which is unique to this revision of the
		// document
		String attachmentPrefix = "nunaliit2_geom_";
		{
			String docRev = docDescriptor.getRevision();
			
			String revNumber = null;
			if( null != docRev ){
				String[] parts = docRev.split("-");
				if( parts.length > 1 ){
					revNumber = parts[0];
				}
			}
			
			Integer revision = null;
			if( null != revNumber ){
				int rev = Integer.parseInt(revNumber);
				if( rev > 0 ){
					revision = new Integer(rev+1); // predict next revision
				}
			}

			if( null != revision ){
				attachmentPrefix += "" + revision + "_";
			}
		}
		
		// Start simplified object
		JSONObject simplified = new JSONObject();
		
		CouchDbDocumentBuilder builder = new CouchDbDocumentBuilder(docDescriptor.getContext().getDoc());
		
		// Remove attachments with geometries
		for(Attachment att : builder.getAttachments()){
			if( att.getContentType().equals(SIMPLIFIED_GEOMETRY_CONTENT_TYPE) ){
				builder.removeAttachment(att);
			}
		}
		
		Geometry originalGeometry = geomDesc.getGeometry();
		WktWriter wktWriter = new WktWriter();
		
		// Save original in its own attachment and save information
		// in simplified structure
		{
			StringWriter sw = new StringWriter();
			wktWriter.write(originalGeometry, sw);
			String originalWkt = sw.toString();

			JSONObject originalAtt = new JSONObject();
			originalAtt.put("wkt", originalWkt);
			
			String originalName = generateAttachmentName(builder, attachmentPrefix+"original");
			simplified.put("original", originalName);
			
			builder.addInlineAttachment(originalName, SIMPLIFIED_GEOMETRY_CONTENT_TYPE, originalWkt);
		}
		
		// Save simplifications in their attachments. Link them to simplified structure
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
			String attName = generateAttachmentName(builder, attachmentPrefix+"res");
			resolutions.put(attName, simplification.getResolution());

			DecimalFormat numFormat = getNumberFormatFromResolution(simplification.getResolution());
			
			StringWriter sw = new StringWriter();
			wktWriter.write(simplification.getGeometry(), numFormat, sw);
			String wkt = sw.toString();

			builder.addInlineAttachment(attName, SIMPLIFIED_GEOMETRY_CONTENT_TYPE, wkt);
		}
		
		// If some simplifications are available, replace geometry with most
		// simplified versions of geometry.
		if( simplifications.size() > 0 ){
			GeometrySimplification mostSimplified = simplifications.get( simplifications.size()-1 );
			geomDesc.setGeometry( mostSimplified.getGeometry() );
			simplified.put("reported_resolution", mostSimplified.getResolution());
			
			// Have bounding box of original geometry saved so that tiling system
			// works correctly
			BoundingBox bbox = originalGeometry.getBoundingBox();
			geomDesc.setBoundingBox(bbox);
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
	
	private DecimalFormat getNumberFormatFromResolution(double resolution){
		if( resolution > 0.0 ){
			double inverseRes = 1/resolution;
			double p = Math.log10(inverseRes);
			double exp = Math.ceil( p );
			
			int numberOfDecimals = (int)exp;
			if( numberOfDecimals < 1 ){
				return new DecimalFormat("0");
			} else {
				String pattern = "0.";
				for(int i=0; i<numberOfDecimals; ++i){
					pattern += "#";
				}
				return new DecimalFormat(pattern);
			}
			
		} else {
			return null;
		}
	}
}
