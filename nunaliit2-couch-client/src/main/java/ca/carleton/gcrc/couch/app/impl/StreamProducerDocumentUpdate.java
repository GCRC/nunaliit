package ca.carleton.gcrc.couch.app.impl;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.Iterator;
import java.util.Set;

import org.json.JSONObject;
import org.json.JSONWriter;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentDigest;
import ca.carleton.gcrc.couch.client.impl.StreamProducer;

public class StreamProducerDocumentUpdate implements StreamProducer {

	private Document sourceDoc;
	private DocumentDigest documentDigest;
	private JSONObject previousDoc;
	private UpdateSpecifier updateSpecifier;
	
	public StreamProducerDocumentUpdate(
		Document sourceDoc
		,DocumentDigest dd
		,JSONObject previousDoc
		,UpdateSpecifier updateSpecifier
		){
		this.sourceDoc = sourceDoc;
		this.documentDigest = dd;
		this.previousDoc = previousDoc;
		this.updateSpecifier = updateSpecifier;
	}
	
	@Override
	public void produce(OutputStream os) throws Exception {
		
		// Compute previous revision
		String previousRevision = null;
		if( null != previousDoc ) {
			previousRevision = previousDoc.getString("_rev");
			if( null == previousRevision ) {
				throw new Exception("On document update, the previous document must contain a revision");
			}
		}
		
		JSONObject sourceJson = sourceDoc.getJSONObject();
		
		OutputStreamWriter osw = new OutputStreamWriter(os,"UTF-8");
		JSONWriter builder = new JSONWriter(osw);
		
		// Start document
		builder.object();
		
		// _id
		builder.key("_id");
		builder.value(sourceDoc.getId());
		
		// _rev
		if( null != previousRevision ) {
			builder.key("_rev");
			builder.value(previousRevision);
		}
		
		// Object content
		{
			Iterator<?> it = sourceJson.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ) {
					String key = (String)keyObj;
					
					if( '_' == key.codePointAt(0) ){
						// Do not copy special keys
					} else if( DocumentManifest.MANIFEST_KEY.equals(key) ){
						// Compute manifest. Do not copy previous copy
					} else {
						Object value = sourceJson.get(key);
						builder.key(key);
						builder.value(value);
					}
				}
			}
		}
		
		// Manifest/Digest
		{
			JSONObject manifest = DocumentManifest.computeManifest(
					sourceDoc
					,documentDigest
					,previousDoc
					,updateSpecifier
					);
			
			builder.key(DocumentManifest.MANIFEST_KEY);
			builder.value(manifest);
		}
		
		// Attachments
		Set<String> attachmentNamesToUpload = updateSpecifier.getAttachmentsToUpload();
		Set<String> attachmentNamesToRetain = updateSpecifier.getAttachmentsNotModified();
		if( attachmentNamesToUpload.size() > 0 
		 || attachmentNamesToRetain.size() > 0
		 ){
			builder.key("_attachments");
			builder.object();
			
			// Send attachments that should be retained
			if( null != previousDoc ){
				JSONObject previousAttachments = previousDoc.getJSONObject("_attachments");
				if( null != previousAttachments ){
					Iterator<?> it = previousAttachments.keys();
					while( it.hasNext() ){
						Object attachmentNameObj = it.next();
						if( attachmentNameObj instanceof String ){
							String attachmentName = (String)attachmentNameObj;
							if( attachmentNamesToRetain.contains(attachmentName) ){
								// This is an attachment found in the previous document
								// that must be retained (remains unchanged). The JSONObject
								// must be sent, as found.
								JSONObject attObj = previousAttachments.getJSONObject(attachmentName);
								builder.key(attachmentName);
								builder.value(attObj);
							}
						}
					}
				}
			}
			
			// Upload attachments that are designated for sending
			for(Attachment attachment : sourceDoc.getAttachments()){
				if( attachmentNamesToUpload.contains(attachment.getName()) ) {
					InputStream is = attachment.getInputStream();
					
					builder.key( attachment.getName() );
					builder.object();
					
					builder.key("content_type");
					builder.value( attachment.getContentType() );
					
					osw.write(",\"data\":\"");
					Base64Transcoder.encode(is, osw);
					osw.write("\"");
					
					builder.endObject();
				}
			}
			
			builder.endObject();
		}

		// End document
		builder.endObject();
		
		osw.flush();
	}

}
