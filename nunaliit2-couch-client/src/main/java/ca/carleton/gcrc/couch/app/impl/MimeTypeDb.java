package ca.carleton.gcrc.couch.app.impl;

import java.util.HashMap;
import java.util.Map;

public class MimeTypeDb {

	static private MimeTypeDb defaultDB;
	
	static synchronized public MimeTypeDb getDefaultDB(){
		if( null == defaultDB ){
			defaultDB = new MimeTypeDb();
			
			defaultDB.addFileExtension("jpg", "image/jpeg");
			defaultDB.addFileExtension("jpeg", "image/jpeg");
			defaultDB.addFileExtension("png", "image/png");
			defaultDB.addFileExtension("gif", "image/gif");
			defaultDB.addFileExtension("svg", "image/svg+xml");

			defaultDB.addFileExtension("mp3", "audio/mpeg");
			defaultDB.addFileExtension("ogg", "application/ogg", MimeType.MultimediaClass.AUDIO);

			defaultDB.addFileExtension("mov", "video/quicktime");

			defaultDB.addFileExtension("pdf", "application/pdf");
			defaultDB.addFileExtension("txt", "text/plain");
			defaultDB.addFileExtension("htm", "text/html");
			defaultDB.addFileExtension("html", "text/html");
			defaultDB.addFileExtension("js", "text/javascript");
			defaultDB.addFileExtension("css", "text/css");
		}
		return defaultDB;
	}
	
	private Map<String,MimeType> typeFromExtension = new HashMap<String,MimeType>();
	private Map<String,MimeType> typeFromContentType = new HashMap<String,MimeType>();
	
	private MimeTypeDb() {
		
	}
	
	public MimeType fromContentType(String contentType){
		return typeFromContentType.get(contentType);
	}
	
	public void addContentType(String contentType){
		MimeType mimeType = new MimeType(contentType);
		typeFromContentType.put(contentType, mimeType);
	}
	
	public void addContentType(String contentType, MimeType.MultimediaClass multimediaClass){
		MimeType mimeType = new MimeType(multimediaClass, contentType);
		typeFromContentType.put(contentType, mimeType);
	}

	public MimeType fromFileExtension(String fileExt){
		return typeFromExtension.get(fileExt.toLowerCase());
	}
	
	public void addFileExtension(String fileExt, MimeType mimeType){
		typeFromExtension.put(fileExt.toLowerCase(), mimeType);
		
		if( false == typeFromContentType.containsKey(mimeType.getContentType()) ) {
			typeFromContentType.put(mimeType.getContentType(), mimeType);
		}
	}
	
	public void addFileExtension(String fileExt, String contentType){
		MimeType mimeType = typeFromContentType.get(contentType);
		if( null == mimeType ){
			mimeType = new MimeType(contentType);
			typeFromContentType.put(mimeType.getContentType(), mimeType);
		}
		
		typeFromExtension.put(fileExt.toLowerCase(), mimeType);
	}
	
	public void addFileExtension(String fileExt, String contentType, MimeType.MultimediaClass multimediaClass){
		MimeType mimeType = new MimeType(multimediaClass, contentType);
		typeFromExtension.put(fileExt.toLowerCase(), mimeType);
		
		if( false == typeFromContentType.containsKey(mimeType.getContentType()) ) {
			typeFromContentType.put(mimeType.getContentType(), mimeType);
		}
	}
}
