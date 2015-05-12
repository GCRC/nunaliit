package ca.carleton.gcrc.couch.onUpload.simplifyGeoms;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import org.apache.commons.codec.binary.Base64;
import org.json.JSONObject;

public class CouchDbDocumentBuilder {

	private JSONObject document;
	
	public CouchDbDocumentBuilder(JSONObject document) {
		this.document = document;
	}
	
	public JSONObject getDocument() {
		return document;
	}
	
	public List<Attachment> getAttachments() throws Exception {
		List<Attachment> attachments = new Vector<Attachment>();
		
		JSONObject _attachments = document.optJSONObject("_attachments");
		if( null != _attachments ){
			Iterator<?> it = _attachments.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					JSONObject att = _attachments.getJSONObject(key);
					attachments.add( new Attachment(key, att) );
				}
			}
		}
		
		return attachments;
	}
	
	public void removeAttachment(Attachment att) throws Exception {
		JSONObject _attachments = document.getJSONObject("_attachments");
		_attachments.remove( att.getName() );

		boolean lastAttachment = true;
		Iterator<?> it = _attachments.keys();
		while( it.hasNext() ){
			it.next();
			lastAttachment = false;
		}
		
		if( lastAttachment ){
			document.remove("_attachments");
		}
	}
	
	public Attachment addInlineAttachment(
			String name,
			String contentType,
			byte[] content
			) throws Exception {
		JSONObject _attachments = document.optJSONObject("_attachments");
		if( null == _attachments ){
			_attachments = new JSONObject();
			document.put("_attachments",_attachments);
		}
		
		String b64Content = Base64.encodeBase64String(content);
		
		JSONObject att = new JSONObject();
		att.put("content_type", contentType);
		att.put("data", b64Content);
		
		_attachments.put(name, att);
		
		return new Attachment(name, att);
	}
	
	public Attachment addInlineAttachment(
			String name,
			String contentType,
			String content
			) throws Exception {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		OutputStreamWriter osw = new OutputStreamWriter(baos, "UTF-8");
		osw.write(content);
		osw.flush();
		
		byte[] contentBytes = baos.toByteArray();
		
		return addInlineAttachment(name, contentType, contentBytes);
	}
	
	public boolean attachmentExists(String attachmentName){
		boolean exists = false;
		
		JSONObject _attachments = document.optJSONObject("_attachments");
		if( null != _attachments ){
			JSONObject att = _attachments.optJSONObject(attachmentName);
			if( null != att ){
				exists = true;
			}
		}
		
		return exists;
	}
}
