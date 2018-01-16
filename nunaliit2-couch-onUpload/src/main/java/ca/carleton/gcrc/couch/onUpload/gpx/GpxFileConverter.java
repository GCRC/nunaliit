package ca.carleton.gcrc.couch.onUpload.gpx;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionMetaData;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.gpx.Gpx;
import ca.carleton.gcrc.gpx.GpxFactory;
import ca.carleton.gcrc.gpx.GpxPoint;
import ca.carleton.gcrc.gpx.GpxRoute;
import ca.carleton.gcrc.gpx.GpxTrack;
import ca.carleton.gcrc.gpx.GpxTrackSegment;
import ca.carleton.gcrc.gpx.GpxWayPoint;

public class GpxFileConverter implements FileConversionPlugin {

	@Override
	public String getName() {
		return "GPX Converter";
	}

	@Override
	public boolean handlesFileClass(String fileClass, String work) {
		
		if( "gpx".equalsIgnoreCase(fileClass) ) {
			if( work == FileConversionPlugin.WORK_ANALYZE ) {
				return true;
			}
			if( work == FileConversionPlugin.WORK_APPROVE ) {
				return true;
			}
		}
		
		return false;
	}

	@Override
	public FileConversionMetaData getFileMetaData(File file) {
		FileConversionMetaData result = new FileConversionMetaData();
		
		GpxFactory factory = new GpxFactory();
		try {
			Gpx gpx = factory.loadFromFile(file);
			if( null != gpx ) {
				result.setFileConvertable(true);
				result.setMimeType("application/xml");
				result.setFileClass("gpx");
			}
			
		} catch(Exception e) {
			result.setFileConvertable(false);
		}
		
		return result;
	}

	@Override
	public void performWork(
		String work
		,AttachmentDescriptor attDescription
		) throws Exception {
		
		if( work == FileConversionPlugin.WORK_ANALYZE ) {
			analyzeFile(attDescription);
		
		} else if( work == FileConversionPlugin.WORK_APPROVE ) {
			approveFile(attDescription);
		
		} else {
			throw new Exception("Plugin can not perform work: "+work);
		}
	}

	public void analyzeFile(AttachmentDescriptor attDescription) throws Exception {
		// No conversion required.
		OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();
		attDescription.setOriginalUpload(true);
		attDescription.setSize(originalObj.getSize());
		attDescription.setContentType(originalObj.getContentType());
		attDescription.setEncodingType(originalObj.getEncodingType());
		attDescription.setMediaFileName(originalObj.getMediaFileName());
	}

	public void approveFile(AttachmentDescriptor attDescription) throws Exception {

		FileConversionContext approvedContext = attDescription.getContext();
		
		GpxFactory factory = new GpxFactory();
		try {
			Gpx gpx = factory.loadFromFile(attDescription.getMediaFile());
			if( null == gpx ) {
				throw new Exception("Conversion returns null object");
			}
			
			JSONObject doc = approvedContext.getDoc();
			
			GpxConversionContext context = new GpxConversionContext();
			context.setLayerName( doc.getString("_id") );
			context.setSourceDocumentId( doc.getString("_id") );
			
			convertGpx(attDescription, context, gpx, doc);
			
			// Save changes to document
			approvedContext.saveDocument();
			
			// Upload original file
			approvedContext.uploadFile(
				attDescription.getAttachmentName()
				,attDescription.getMediaFile()
				,"application/xml"
				);
			
		} catch(Exception e) {
			String gpxFileName = null;
			if( null != attDescription.getMediaFile() ) {
				gpxFileName = attDescription.getMediaFile().getAbsolutePath();
			}
			throw new Exception("Unable to convert using GPX: "+gpxFileName,e);
		}
	}

	private void convertGpx(
		AttachmentDescriptor attDescription
		,GpxConversionContext context
		,Gpx gpx
		,JSONObject doc
		) throws Exception {
		
		// Attach GPX information
		{
			JSONObject obj = new JSONObject();
			
			String name = gpx.getName();
			String description = gpx.getDescription();
			
			if( null != name ) {
				obj.put("name", name);
			}
			if( null != description ) {
				obj.put("description", description);
			}
			
			doc.put("gpx", obj);
		}

		// Tracks
		List<GpxTrack> tracks = gpx.getTracks();
		if( null != tracks && tracks.size() > 0 ) {
			for(GpxTrack tr : tracks) {
				convertTrack(attDescription.getContext(), context, tr);
			}
		}

		// Routes
		List<GpxRoute> routes = gpx.getRoutes();
		if( null != routes && routes.size() > 0 ) {
			for(GpxRoute rt : routes) {
				convertRoute(attDescription.getContext(), context, rt);
			}
		}

		// Way Points
		List<GpxWayPoint> wayPoints = gpx.getWayPoints();
		if( null != wayPoints && wayPoints.size() > 0 ) {
			for(GpxWayPoint wp : wayPoints) {
				convertWayPoint(attDescription.getContext(), context, wp);
			}
		}
		
		// Create layer definition
		{
			JSONObject layerDef = new JSONObject();
			
			layerDef.put("nunaliit_type", "layerDefinition");
			layerDef.put("id", context.getLayerName());

			String originalFileName = attDescription.getOriginalName();
			
			if( null != gpx.getName() ) {
				layerDef.put("name", "GPX - "+gpx.getName());
				
			} else if( null != originalFileName ) {
				layerDef.put("name", "GPX - "+originalFileName);

			} else {
				layerDef.put("name", "GPX");
			}
			
			GpxBounds bounds = context.getLayerBounds();
			JSONArray bbox = null;
			if( null != bounds ) {
				bbox = bounds.asJSONArray();
			}
			if( null != bbox ) {
				layerDef.put("bbox", bbox);
			}
			
			doc.put("nunaliit_layer_definition", layerDef);
		}
	}

	private void convertTrack(
		FileConversionContext approvedContext
		,GpxConversionContext context
		,GpxTrack tr
		) throws Exception {
		
		JSONObject obj = new JSONObject();
		
		installCommonFields(approvedContext, context, obj);
		
		String name = tr.getName();
		String description = tr.getDescription();
		List<GpxTrackSegment> segments = tr.getSegments();
		
		// Compute bounding box, geometry
		JSONArray bbox = null;
		String geometry = null;
		if( null != segments && segments.size() > 0 ) {
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			GpxBounds geometryBounds = new GpxBounds();
			GpxBounds layerBounds = context.getLayerBounds();
			
			pw.print("MULTILINESTRING(");

			for(GpxTrackSegment seg : segments) {
				pw.print("(");
				boolean firstPointInLine = true;
				for(GpxPoint pt : seg.getPoints()) {
					// BBOX
					geometryBounds.expandToInclude(pt.getLong(), pt.getLat());
					layerBounds.expandToInclude(pt.getLong(), pt.getLat());
					
					// Geometry
					if( firstPointInLine ) {
						firstPointInLine = false;
					} else {
						pw.print(",");
					}
					pw.print( pt.getLong() );
					pw.print(" ");
					pw.print( pt.getLat() );
				}
				pw.print(")");
			}
			

			pw.print(")");
			pw.flush();
			geometry = sw.toString();
			
			bbox = geometryBounds.asJSONArray();
		}
		
		// Geometry
		if( null != geometry && null != bbox ) {
			JSONObject geom = new JSONObject();
			
			geom.put("nunaliit_type", "geometry");
			geom.put("wkt", geometry);
			geom.put("bbox", bbox);
			
			obj.put("nunaliit_geom", geom);
		}
		
		// Attributes
		{
			JSONObject attr = new JSONObject();
			
			if( null != name ) {
				attr.put("name", name);
			}
			if( null != description ) {
				attr.put("description", description);
			}

			obj.put("attributes", attr);
		}
		
		// Create document
		approvedContext.createDocument(obj);
	}

	private void convertRoute(
		FileConversionContext approvedContext
		,GpxConversionContext context
		,GpxRoute rt
		) throws Exception {

		JSONObject obj = new JSONObject();
		
		installCommonFields(approvedContext, context, obj);
		
		String name = rt.getName();
		String description = rt.getDescription();
		List<GpxPoint> points = rt.getRoutePoints();
		
		// Compute bounding box, geometry
		JSONArray bbox = null;
		String geometry = null;
		if( null != points && points.size() > 0 ) {
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			GpxBounds geometryBounds = new GpxBounds();
			GpxBounds layerBounds = context.getLayerBounds();
			
			pw.print("MULTILINESTRING((");
			boolean firstPointInLine = true;
			for(GpxPoint pt : points) {
				// BBOX
				geometryBounds.expandToInclude(pt.getLong(), pt.getLat());
				layerBounds.expandToInclude(pt.getLong(), pt.getLat());
				
				// Geometry
				if( firstPointInLine ) {
					firstPointInLine = false;
				} else {
					pw.print(",");
				}
				pw.print( pt.getLong() );
				pw.print(" ");
				pw.print( pt.getLat() );
			}
			pw.print("))");
			pw.flush();
			geometry = sw.toString();
			
			bbox = geometryBounds.asJSONArray();
		}
		
		// Geometry
		if( null != geometry && null != bbox ) {
			JSONObject geom = new JSONObject();
			
			geom.put("nunaliit_type", "geometry");
			geom.put("wkt", geometry);
			geom.put("bbox", bbox);
			
			obj.put("nunaliit_geom", geom);
		}
		
		// Attributes
		{
			JSONObject attr = new JSONObject();
			
			if( null != name ) {
				attr.put("name", name);
			}
			if( null != description ) {
				attr.put("description", description);
			}

			obj.put("attributes", attr);
		}
		
		// Create document
		approvedContext.createDocument(obj);
	}

	private void convertWayPoint(
		FileConversionContext approvedContext
		,GpxConversionContext context
		,GpxPoint pt
		) throws Exception {

		JSONObject obj = new JSONObject();
		
		installCommonFields(approvedContext, context, obj);
		
		String name = pt.getName();
		String description = pt.getDescription();
		BigDecimal lat = pt.getLat();
		BigDecimal lon = pt.getLong();
		BigDecimal elevation = pt.getElevation();
		Date time = pt.getTime();

		// Geometry
		if( null != lat && null != lon ) {
			GpxBounds geometryBounds = new GpxBounds();
			GpxBounds layerBounds = context.getLayerBounds();

			geometryBounds.expandToInclude(lon, lat);
			layerBounds.expandToInclude(lon, lat);
			
			JSONObject geom = new JSONObject();
			
			geom.put("nunaliit_type", "geometry");
			geom.put("wkt", "POINT("+lon+" "+lat+")");
			
			JSONArray bbox = geometryBounds.asJSONArray();
			geom.put("bbox", bbox);
			
			obj.put("nunaliit_geom", geom);
		}
		
		// Attributes
		{
			JSONObject attr = new JSONObject();
			
			if( null != name ) {
				attr.put("name", name);
			}
			if( null != description ) {
				attr.put("description", description);
			}
			if( null != elevation ) {
				attr.put("ele", elevation);
			}
			if( null != time ) {
				attr.put("time", time.getTime());
			}

			obj.put("attributes", attr);
		}
		
		// Create document
		approvedContext.createDocument(obj);
	}

	private void installCommonFields(
		FileConversionContext approvedContext
		,GpxConversionContext context
		,JSONObject obj
		) throws Exception {
		
		DocumentDescriptor docDescriptor = approvedContext.getDocument();
		
		// GPX Source
		{
			JSONObject source = new JSONObject();
			
			source.put("nunaliit_type", "reference");
			source.put("doc", context.getSourceDocumentId());

			obj.put("source", source);
		}
		
		// Layers
		{
			JSONArray layers = new JSONArray();
			layers.put( context.getLayerName() );
			obj.put("nunaliit_layers", layers);
		}
		
		
		// Created
		obj.put("nunaliit_created", docDescriptor.getCreatedObject());
		
		// Last Updated
		obj.put("nunaliit_last_updated", docDescriptor.getLastUpdatedObject());
	}
}
