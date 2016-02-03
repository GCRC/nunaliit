package ca.carleton.gcrc.couch.utils;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.Document;

/**
 * Wrapper to Document to add Nunaliit specific behaviour.
 *
 */
public class NunaliitDocument implements Document {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private Document wrapped;
	
	public NunaliitDocument(Document doc){
		this.wrapped = doc;
	}
	
	@Override
	public String getId() {
		return wrapped.getId();
	}

	@Override
	public void setId(String id) throws Exception {
		wrapped.setId(id);
	}

	@Override
	public String getRevision() {
		return wrapped.getRevision();
	}

	@Override
	public JSONObject getJSONObject() {
		return wrapped.getJSONObject();
	}

	@Override
	public Collection<Attachment> getAttachments() {
		return wrapped.getAttachments();
	}

	@Override
	public Attachment getAttachmentByName(String attachmentName) {
		return wrapped.getAttachmentByName(attachmentName);
	}

	/**
	 * Return the original geometry associated with the document. This is the
	 * geometry that was first submitted with the document. If the document
	 * does not contain a geometry, then null is returned.
	 * @return The original geometry, or null if no geometry is found.
	 * @throws Exception
	 */
	public NunaliitGeometry getOriginalGometry() throws Exception {

		NunaliitGeometryImpl result = null;
		
		JSONObject jsonDoc = getJSONObject();
		
		JSONObject nunalitt_geom = jsonDoc.optJSONObject(CouchNunaliitConstants.DOC_KEY_GEOMETRY);
		if( null != nunalitt_geom ){
			// By default, the wkt is the geometry
			String wkt = nunalitt_geom.optString("wkt", null);
			
			// Check if a simplified structure is specified
			JSONObject simplified = nunalitt_geom.optJSONObject("simplified");
			if( null == simplified ) {
				logger.trace("Simplified structure is not available");
			} else {
				logger.trace("Accessing simplified structure");

				String originalAttachmentName = simplified.optString("original", null);
				if( null == originalAttachmentName ){
					throw new Exception("Original attachment name not found in simplified structure");
				} else {
					// The original geometry is in the specified attachment
					Attachment attachment = getAttachmentByName(originalAttachmentName);
					if( null == attachment ) {
						throw new Exception("Named original attachment not found: "+getId()+"/"+originalAttachmentName);
					} else {
						InputStream is = null;
						InputStreamReader isr = null;
						try {
							is = attachment.getInputStream();
							isr = new InputStreamReader(is,"UTF-8");
							StringWriter sw = new StringWriter();
							char[] buffer = new char[1024];
							int size = isr.read(buffer);
							while( size >= 0 ){
								sw.write(buffer);
								size = isr.read(buffer);
							}
							sw.flush();
							wkt = sw.toString();
							
							isr.close();
							isr = null;
							is.close();
							is = null;
							
						} catch (Exception e) {
							logger.error("Error obtaining attachment "+getId()+"/"+originalAttachmentName,e);
							
							if( null != isr ){
								try {
									isr.close();
									isr = null;
								} catch(Exception e1) {
									// ignore
								}
							}
							if( null != is ){
								try {
									is.close();
									is = null;
								} catch(Exception e1) {
									// ignore
								}
							}
							
							throw new Exception("Error obtaining attachment "+getId()+"/"+originalAttachmentName,e);
						}
					}
				}
			}
			
			if( null != wkt ){
				result = new NunaliitGeometryImpl();
				result.setWKT(wkt);
			}
		}
		
		return result;
	}	

	public List<JSONObject> findStructuresOfType(String type){
		JSONObject doc = getJSONObject();
		
		List<JSONObject> structures = new Vector<JSONObject>();
		
		findStructuresOfType(doc, type, structures);
		
		return structures;
	}

	private void findStructuresOfType(Object obj, String type, List<JSONObject> structures){
		if( obj instanceof JSONObject ){
			JSONObject jsonObj = (JSONObject)obj;
			
			String nunaliitType = jsonObj.optString("nunaliit_type");
			if( null != nunaliitType && nunaliitType.equals(type) ){
				structures.add(jsonObj);
			}
			
			// Iterate over children structures
			Iterator<?> it = jsonObj.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = jsonObj.opt(key);
					if( null != value ){
						findStructuresOfType(value, type, structures);
					}
				}
			}
		} else if( obj instanceof JSONArray ) {
			JSONArray jsonArr = (JSONArray)obj;
			
			// Iterate over children values
			for(int i=0,e=jsonArr.length(); i<e; ++i){
				Object value = jsonArr.opt(i);
				if( null != value ){
					findStructuresOfType(value, type, structures);
				}
			};
		}
	}
}
