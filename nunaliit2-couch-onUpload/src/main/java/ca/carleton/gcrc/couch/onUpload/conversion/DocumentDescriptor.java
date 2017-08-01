package ca.carleton.gcrc.couch.onUpload.conversion;

import java.util.Iterator;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import ca.carleton.gcrc.json.JSONSupport;

public class DocumentDescriptor extends AbstractDescriptor {

	private FileConversionContext context;
	
	public DocumentDescriptor(FileConversionContext context){
		this.context = context;
	}
	
	public FileConversionContext getContext() {
		return context;
	}
	
	@Override
	protected JSONObject getJson() throws Exception {
		return context.getDoc();
	}
	
	public String getDocId() throws Exception {
		JSONObject doc = getJson();
		return doc.getString(UploadConstants.KEY_DOC_ID);
	}
	
	public String getRevision() throws Exception {
		JSONObject doc = getJson();
		return doc.optString(UploadConstants.KEY_DOC_REV);
	}

	public boolean isAttachmentDescriptionAvailable(String attName) throws Exception {
		JSONObject doc = getJson();
		JSONObject attachments = doc.optJSONObject(UploadConstants.KEY_DOC_ATTACHMENTS);
		if( null == attachments ) {
			return false;
		}

		JSONObject files = attachments.optJSONObject("files");
		if( null == files ) {
			return false;
		}
		
		JSONObject attachmentDescription = files.optJSONObject(attName);
		if( null == attachmentDescription ) {
			return false;
		}
		
		return true;
	}
	
	public AttachmentDescriptor getAttachmentDescription(String attName) throws Exception {
		
		if( null == attName ){
			throw new Exception("attachment name must be provided");
		}
		
		JSONObject doc = getJson();
		JSONObject attachments = doc.optJSONObject(UploadConstants.KEY_DOC_ATTACHMENTS);
		if( null == attachments ) {
			attachments = new JSONObject();
			attachments.put("nunaliit_type", UploadConstants.VALUE_NUNALIIT_TYPE_ATTACHMENTS);
			doc.put(UploadConstants.KEY_DOC_ATTACHMENTS,attachments);
		}

		JSONObject files = attachments.optJSONObject("files");
		if( null == files ) {
			files = new JSONObject();
			attachments.put("files",files);
		}

		JSONObject attachmentDescription = files.optJSONObject(attName);
		if( null == attachmentDescription ) {
			attachmentDescription = new JSONObject();
			attachmentDescription.put("attachmentName", attName);
			files.put(attName, attachmentDescription);
		}
		
		return new AttachmentDescriptor(this, attName);
	}
	
	public AttachmentDescriptor findAttachmentWithUploadId(String uploadId) throws Exception {

		JSONObject doc = getJson();
		
		JSONObject nunaliitAttachments = doc.optJSONObject(UploadConstants.KEY_DOC_ATTACHMENTS);

		JSONObject files = null;
		if( null != nunaliitAttachments ){
			files = nunaliitAttachments.optJSONObject("files");
		}
		
		if( null != files ){
			Iterator<?> keyIt = files.keys();
			while( keyIt.hasNext() ){
				Object keyObj = keyIt.next();
				if( keyObj instanceof String ){
					String attName = (String)keyObj;
					JSONObject attachment = files.optJSONObject(attName);
					if( null != attachment ){
						String attachmentUploadId = attachment.optString("uploadId");
						if( null != attachmentUploadId ){
							if( attachmentUploadId.equals(uploadId) ){
								return new AttachmentDescriptor(this, attName);
							}
						}
					}
				}
			}
		}
		
		return null;
	}

	public boolean isGeometryDescriptionAvailable() throws Exception {
		JSONObject doc = getJson();
		JSONObject geometry = doc.optJSONObject(UploadConstants.KEY_DOC_GEOMETRY);
		return ( null != geometry );
	}
	
	public GeometryDescriptor getGeometryDescription() throws Exception {
		JSONObject doc = getJson();
		JSONObject geometry = doc.optJSONObject(UploadConstants.KEY_DOC_GEOMETRY);
		if( null == geometry ){
			geometry = new JSONObject();
			geometry.put("nunaliit_type", UploadConstants.VALUE_NUNALIIT_TYPE_GEOMETRY);
			doc.put(UploadConstants.KEY_DOC_GEOMETRY, geometry);
		}
		
		return new GeometryDescriptor(this);
	}
	
	public void removeGeometryDescription() throws Exception {
		JSONObject doc = getJson();
		doc.remove(UploadConstants.KEY_DOC_GEOMETRY);
	}
	
	public CreateUpdateInfo getCreatedObject() throws Exception {
		CreateUpdateInfo result = null;
		
		JSONObject doc = getJson();
		if( JSONSupport.containsKey(doc, CouchNunaliitConstants.DOC_KEY_CREATED) ) {
			result = new CreateUpdateInfo(this, CouchNunaliitConstants.DOC_KEY_CREATED);
		}
		
		return result;
	}
	
	public CreateUpdateInfo getLastUpdatedObject() throws Exception {
		CreateUpdateInfo result = null;
		
		JSONObject doc = getJson();
		if( JSONSupport.containsKey(doc, CouchNunaliitConstants.DOC_KEY_LAST_UPDATED) ) {
			result = new CreateUpdateInfo(this, CouchNunaliitConstants.DOC_KEY_LAST_UPDATED);
		}
		
		return result;
	}
	
	public boolean isFilePresent(String name) throws Exception {
		JSONObject doc = getJson();
		JSONObject _att = doc.optJSONObject("_attachments");
		if( null == _att ) return false;
		
		return JSONSupport.containsKey(_att, name);
	}
	
	public void removeFile(String name) throws Exception {
		JSONObject doc = getJson();
		JSONObject _att = doc.optJSONObject("_attachments");
		if( null == _att ) return;
		
		if( JSONSupport.containsKey(_att, name) ) {
			_att.remove(name);
		}
	}

	public String getSchemaName() throws Exception {
		JSONObject doc = getJson();
		if( JSONSupport.containsKey(doc, CouchNunaliitConstants.DOC_KEY_SCHEMA) ) {
			Object value = doc.get(CouchNunaliitConstants.DOC_KEY_SCHEMA);
			if( null != value 
			 && value instanceof String ){
				String schemaName = (String)value;
				return schemaName;
			}
		}
		
		return null;
	}
	
	public void setSchemaName(String schemaName) throws Exception {
		JSONObject doc = getJson();
		if( null == schemaName ){
			if( JSONSupport.containsKey(doc, CouchNunaliitConstants.DOC_KEY_SCHEMA) ) {
				doc.remove(CouchNunaliitConstants.DOC_KEY_SCHEMA);
			}
		} else {
			doc.put(CouchNunaliitConstants.DOC_KEY_SCHEMA, schemaName);
		}
	}
}
