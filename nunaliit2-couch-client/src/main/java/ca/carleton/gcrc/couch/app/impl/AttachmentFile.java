package ca.carleton.gcrc.couch.app.impl;

import java.io.InputStream;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.fsentry.FSEntry;

public class AttachmentFile implements Attachment {

	private String name;
	private FSEntry entry;
	private String contentType;
	
	public AttachmentFile(String name, FSEntry file, String contentType){
		this.name = name;
		this.entry = file;
		this.contentType = contentType;
	}
	
	@Override
	public String getName() {
		return name;
	}

	@Override
	public InputStream getInputStream() throws Exception {
		return entry.getInputStream();
	}

	@Override
	public String getContentType() throws Exception {
		return contentType;
	}

	@Override
	public long getSize() throws Exception {
		return entry.getSize();
	}

}
