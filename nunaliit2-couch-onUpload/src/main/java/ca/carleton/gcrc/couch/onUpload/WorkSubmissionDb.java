package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.utils.SubmissionUtils;
import ca.carleton.gcrc.json.JSONSupport;

public class WorkSubmissionDb implements Work {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDesignDocument submissionDbDesign;
	private String state;
	private String docId;
	private String attachmentName;
	private String uploadId;
	private String uploadRequestDocId;
	private JSONObject submissionDoc = null;
	private JSONObject submittedDoc = null;
	private JSONObject originalSubmissionDoc = null;

	public WorkSubmissionDb(CouchDesignDocument submissionDbDesign, String state, String docId){
		this.submissionDbDesign = submissionDbDesign;
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
		if( null == submittedDoc ){
			logger.debug("Loading document "+docId);

			submissionDoc = submissionDbDesign.getDatabase().getDocument(docId);
			submittedDoc = SubmissionUtils.getSubmittedDocumentFromSubmission(submissionDoc);
			originalSubmissionDoc = JSONSupport.copyObject(submissionDoc);
		}
		return submittedDoc;
	}

	@Override
	public void saveDocument() throws Exception {
		SubmissionUtils.DocAndReserved docAndReserved = 
				SubmissionUtils.computeDocAndReservedFromDocument(submittedDoc);

		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		submissionInfo.put("submitted_doc",docAndReserved.doc);
		submissionInfo.put("submitted_reserved",docAndReserved.reserved);
		
		if( 0 != JSONSupport.compare(submissionDoc, originalSubmissionDoc) ){
			logger.debug("Saving document "+docId);

			submissionDbDesign.getDatabase().updateDocument(submissionDoc);

			submissionDoc = null;
			submittedDoc = null;
			originalSubmissionDoc = null;
		}
	}

	@Override
	public void uploadAttachment(
			String attachmentName
			,File uploadedFile
			,String mimeType
			) throws Exception {
		throw new Exception("Can not upload attachment to submission database");
	}
	
	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		pw.print("Submission Work(");
		
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
