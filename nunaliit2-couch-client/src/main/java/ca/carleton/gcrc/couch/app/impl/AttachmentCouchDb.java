package ca.carleton.gcrc.couch.app.impl;

import java.io.InputStream;
import java.net.URL;
import java.net.URLEncoder;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.impl.ConnectionStreamResult;
import ca.carleton.gcrc.couch.client.impl.ConnectionUtils;

public class AttachmentCouchDb implements Attachment {

	private CouchDb couchDb;
	private String docId;
	private String attachmentName;
	private String contentType;
	private long size;
	
	public AttachmentCouchDb(CouchDb couchDb, String docId, String attachmentName, String contentType, long size){
		this.couchDb = couchDb;
		this.docId = docId;
		this.attachmentName = attachmentName;
		this.contentType = contentType;
		this.size = size;
	}
	
	@Override
	public String getName() {
		return attachmentName;
	}

	@Override
	public InputStream getInputStream() throws Exception {

		String path = URLEncoder.encode(docId,"UTF-8")
			+ "/"
			+ URLEncoder.encode(attachmentName,"UTF-8");
		URL attachmentUrl = new URL(couchDb.getUrl(), path);
		
		// GET
		ConnectionStreamResult result = ConnectionUtils.getStreamResource(
			couchDb.getContext()
			,attachmentUrl
			);
		
		return result.getInputStream();
	}

	@Override
	public String getContentType() throws Exception {
		return contentType;
	}

	@Override
	public long getSize() throws Exception {
		return size;
	}

}
