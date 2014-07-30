package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.json.JSONSupport;

public class WorkDocumentDb implements Work {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDesignDocument documentDbDesign;
	private String state;
	private String docId;
	private String attachmentName;
	private String uploadId;
	private String uploadRequestDocId;
	private JSONObject doc = null;
	private JSONObject originalDoc = null;

	public WorkDocumentDb(CouchDesignDocument documentDbDesign, String state, String docId){
		this.documentDbDesign = documentDbDesign;
		this.state = state;
		this.docId = docId;
	}
	
	@Override
	public String getState() {
		return state;
	}
	
	@Override
	public String getDocId() {
		return docId;
	}

	@Override
	public String getAttachmentName() {
		return attachmentName;
	}
	public void setAttachmentName(String attachmentName) {
		this.attachmentName = attachmentName;
	}
	
	@Override
	public String getUploadId() {
		return uploadId;
	}
	public void setUploadId(String uploadId) {
		this.uploadId = uploadId;
	}
	
	@Override
	public String getUploadRequestDocId() {
		return uploadRequestDocId;
	}
	public void setUploadRequestDocId(String uploadRequestDocId) {
		this.uploadRequestDocId = uploadRequestDocId;
	}

	@Override
	public JSONObject getDocument() throws Exception {
		if( null == doc ){
			logger.debug("Loading document "+docId);

			doc = documentDbDesign.getDatabase().getDocument(docId);
			originalDoc = JSONSupport.copyObject(doc);
		}
		return doc;
	}

	@Override
	public void saveDocument() throws Exception {
		if( 0 != JSONSupport.compare(doc, originalDoc) ){
			logger.debug("Saving document "+docId);
			
			// Modified since loaded
			documentDbDesign.getDatabase().updateDocument(doc);
			doc = null;
			originalDoc = null;
		}
	}

	@Override
	public void uploadAttachment(
			String attachmentName
			,File uploadedFile
			,String mimeType
			) throws Exception {
		
		saveDocument();

		logger.debug("Upload "+attachmentName+" to document "+docId);
		
		JSONObject document = getDocument();
		documentDbDesign.getDatabase().uploadAttachment(
			document
			,attachmentName
			,uploadedFile
			,mimeType
			);

		// Force fetching again
		doc = null;
		originalDoc = null;
	}
	
	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("Document Work(");
		
		if( null != state ){
			pw.print("state:"+state);
		}
		if( null != docId ){
			pw.print(" id:"+docId);
		}
		if( null != attachmentName ){
			pw.print(" att:"+attachmentName);
		}
		if( null != uploadId ){
			pw.print(" uploadId:"+uploadId);
		}
		if( null != uploadRequestDocId ){
			pw.print(" uploadRequestDocId:"+uploadRequestDocId);
		}
		
		pw.print(")");
		
		pw.flush();
		return sw.toString();
	}
}
