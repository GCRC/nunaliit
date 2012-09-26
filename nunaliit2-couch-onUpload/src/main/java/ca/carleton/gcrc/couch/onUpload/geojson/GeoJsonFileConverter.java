package ca.carleton.gcrc.couch.onUpload.geojson;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.List;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionMetaData;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.geom.BoundingBox;
import ca.carleton.gcrc.geom.Geometry;
import ca.carleton.gcrc.geom.geojson.GeoJsonFeature;
import ca.carleton.gcrc.geom.geojson.GeoJsonParser;
import ca.carleton.gcrc.geom.wkt.WktWriter;

public class GeoJsonFileConverter implements FileConversionPlugin {

	protected Logger logger = Logger.getLogger( this.getClass() );
	
	static private WktWriter wktWriter = new WktWriter();

	@Override
	public String getName() {
		return "GeoJSON Converter";
	}

	@Override
	public boolean handlesFileClass(String fileClass, String work) {
		
		if( "geojson".equalsIgnoreCase(fileClass) ) {
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

		FileInputStream fis = null;
		try {
			fis = new FileInputStream(file);
			InputStreamReader reader = new InputStreamReader(fis,"UTF-8");
			
			GeoJsonParser parser = new GeoJsonParser();
			parser.parse(reader);

			result.setFileConvertable(true);
			result.setMimeType("application/json");
			result.setFileClass("geojson");
			
		} catch(Exception e) {
			result.setFileConvertable(false);
			
		} finally {
			if( null != fis ) {
				try {
					fis.close();
				} catch(Exception e) {
					// ignore
				}
			}
		}
		
		return result;
	}

	@Override
	public void performWork(
		String work
		,FileConversionContext conversionContext
		) throws Exception {
		
		logger.debug("GeoJSON start perform work: "+work);
		
		if( work == FileConversionPlugin.WORK_ANALYZE ) {
			analyzeFile(conversionContext);
		
		} else if( work == FileConversionPlugin.WORK_APPROVE ) {
			approveFile(conversionContext);
		
		} else {
			throw new Exception("Plugin can not perform work: "+work);
		}
		
		logger.debug("GeoJSON end perform work: "+work);
	}

	public void analyzeFile(FileConversionContext conversionContext) throws Exception {
		// No conversion required.
		AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();
		OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();
		attDescription.setSize(originalObj.getSize());
		attDescription.setContentType(originalObj.getContentType());
		attDescription.setEncodingType(originalObj.getEncodingType());
		attDescription.setMediaFileName(originalObj.getMediaFileName());
	}

	public void approveFile(FileConversionContext approvedContext) throws Exception {

		AttachmentDescriptor attDescription = approvedContext.getAttachmentDescription();
		
		String fullFileName = null;
		FileInputStream fis = null;
		try {
			File file = attDescription.getMediaFile();
			fullFileName = file.getAbsolutePath();
			
			fis = new FileInputStream(file);
			InputStreamReader reader = new InputStreamReader(fis,"UTF-8");
			
			GeoJsonParser parser = new GeoJsonParser();
			List<GeoJsonFeature> features = parser.parse(reader);

			fis.close();
			fis = null;
			
			logger.debug("Number of uploaded features: "+features.size());

			int count = 0;
			try {
				for(GeoJsonFeature feature : features){
					++count;
					logger.debug("Creating geojson feature: "+count);

					uploadFeature(feature, approvedContext);
				}
			} catch(Exception e) {
				throw new Exception("Error while uploading GeoJSON features",e);
			}

			logger.debug("Done creating geojson features");
			
			JSONObject doc = approvedContext.getDoc();

			logger.debug("Obtained document");
			
			// Create layer definition
			{
				JSONObject layerDef = new JSONObject();
				
				layerDef.put("nunaliit_type", "layerDefinition");
				layerDef.put("id", approvedContext.getId());

				String originalFileName = attDescription.getOriginalName();
				
				if( null != originalFileName ) {
					layerDef.put("name", "GeoJSON - "+originalFileName);

				} else {
					layerDef.put("name", "GeoJSON");
				}
				

				logger.debug("Computing BBOX");

				// BBOX
				{
					boolean include = false;
					BoundingBox boundingBox = new BoundingBox();
					for(GeoJsonFeature feature : features){
						Geometry geometry = feature.getGeometry();
						if( null != geometry ){
							geometry.extendBoundingBox(boundingBox);
							include = true;
						}
					}
					if( include ){
						JSONArray bbox = new JSONArray();
						bbox.put( boundingBox.getMinX() );
						bbox.put( boundingBox.getMinY() );
						bbox.put( boundingBox.getMaxX() );
						bbox.put( boundingBox.getMaxY() );

						layerDef.put("bbox", bbox);
					}
				}
				
				doc.put("nunaliit_layer_definition", layerDef);
				approvedContext.setSavingRequired(true);
			}
			
			logger.debug("Updating layer definition document: "+doc.getString("_id"));
			
			// Save changes to document
			approvedContext.saveDocument();
			
			logger.debug("Uploading file: "+approvedContext.getAttachmentName());
			
			// Upload original file
			approvedContext.uploadFile(
				approvedContext.getAttachmentName()
				,attDescription.getMediaFile()
				,"application/xml"
				);
			
		} catch(Exception e) {
			throw new Exception("Unable to convert using GeoJSON: "+fullFileName,e);
			
		} finally {
			if( null != fis ) {
				try {
					fis.close();
				} catch(Exception e) {
					// ignore
				}
			}
		}
	}
	
	private void uploadFeature(
		GeoJsonFeature feature
		,FileConversionContext approvedContext
		) throws Exception {
		
		JSONObject obj = new JSONObject();
		
		// GPX Source
		{
			JSONObject source = new JSONObject();
			
			source.put("nunaliit_type", "reference");
			source.put("doc", approvedContext.getId());

			obj.put("source", source);
		}
		
		// Layers
		{
			JSONArray layers = new JSONArray();
			layers.put( approvedContext.getId() );
			obj.put("nunaliit_layers", layers);
		}
		
		// Created
		obj.put("nunaliit_created", approvedContext.getCreatedObject());
		
		// Last Updated
		obj.put("nunaliit_last_updated", approvedContext.getLastUpdatedObject());
		
		// Geometry
		{
			Geometry geometry = feature.getGeometry();
			if( null != geometry ) {
				// WKT
				StringWriter wkt = new StringWriter();
				wktWriter.write(geometry, wkt);
				
				// Bounding box
				BoundingBox bb = geometry.getBoundingBox();
				JSONArray bbox = new JSONArray();
				bbox.put( bb.getMinX() );
				bbox.put( bb.getMinY() );
				bbox.put( bb.getMaxX() );
				bbox.put( bb.getMaxY() );

				JSONObject geom = new JSONObject();
				
				geom.put("nunaliit_type", "geometry");
				geom.put("wkt", wkt.toString());
				geom.put("bbox", bbox);
				
				obj.put("nunaliit_geom", geom);
			}
		}
		
		// Properties
		{
			JSONObject props = feature.getProperties();
			if( null != props ) {
				obj.put("geojson", props);
			}
		}
		
		// Create document
		approvedContext.getDatabase().createDocument(obj);
	}
}
