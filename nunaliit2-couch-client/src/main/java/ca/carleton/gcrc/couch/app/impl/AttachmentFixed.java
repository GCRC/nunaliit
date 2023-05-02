package ca.carleton.gcrc.couch.app.impl;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;

import ca.carleton.gcrc.couch.app.Attachment;

public class AttachmentFixed implements Attachment {

	private String name;
	private byte[] content;
	private String contentType;
	
	public AttachmentFixed(String name, byte[] content, String contentType){
		this.name = name;
		this.content = content;
		this.contentType = contentType;
	}
	
	public AttachmentFixed(String name, String content, String contentType) throws Exception {
		this.name = name;
		this.contentType = contentType;
		
		try (
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			OutputStreamWriter osw = new OutputStreamWriter(baos,"UTF-8");
		) {
			osw.write(content);
			osw.flush();
			this.content = baos.toByteArray();
		}
	}
	
	@Override
	public String getName() {
		return name;
	}

	@Override
	public InputStream getInputStream() throws Exception {
		ByteArrayInputStream bais = new ByteArrayInputStream(content); 
		return bais;
	}

	@Override
	public String getContentType() throws Exception {
		return contentType;
	}

	@Override
	public long getSize() throws Exception {
		return content.length;
	}

}
