package ca.carleton.gcrc.couch.onUpload;

public class Work {

	private String state;
	private String docId;
	private String attachmentName;
	private String uploadId;
	private String uploadRequestDocId;

	public String getState() {
		return state;
	}
	public void setState(String state) {
		this.state = state;
	}
	
	public String getDocId() {
		return docId;
	}
	public void setDocId(String docId) {
		this.docId = docId;
	}

	public String getAttachmentName() {
		return attachmentName;
	}
	public void setAttachmentName(String attachmentName) {
		this.attachmentName = attachmentName;
	}
	
	public String getUploadId() {
		return uploadId;
	}
	public void setUploadId(String uploadId) {
		this.uploadId = uploadId;
	}
	
	public String getUploadRequestDocId() {
		return uploadRequestDocId;
	}
	public void setUploadRequestDocId(String uploadRequestDocId) {
		this.uploadRequestDocId = uploadRequestDocId;
	}
}
