package ca.carleton.gcrc.couch.app.impl;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MimeType {

	static private Pattern patternAudio = Pattern.compile("audio/.*");
	static private Pattern patternVideo = Pattern.compile("video/.*");
	static private Pattern patternImage = Pattern.compile("image/.*");

	public enum MultimediaClass {
		AUDIO("audio")
		,VIDEO("video")
		,IMAGE("image")
		;
		
		private String value;
		MultimediaClass(String value) {
			this.value = value;
		}
		public String getValue() {
			return value;
		}
	}
	
	private MultimediaClass multimediaClass;
	private String contentType;
	
	public MimeType(MultimediaClass multimediaClass, String contentType){
		this.multimediaClass = multimediaClass;
		this.contentType = contentType;
	}
	
	public MimeType(String contentType){
		this.contentType = contentType;

		{
			Matcher matcher = patternAudio.matcher(contentType);
			if( matcher.matches() ) {
				this.multimediaClass = MultimediaClass.AUDIO;
			}
		}
		{
			Matcher matcher = patternVideo.matcher(contentType);
			if( matcher.matches() ) {
				this.multimediaClass = MultimediaClass.VIDEO;
			}
		}
		{
			Matcher matcher = patternImage.matcher(contentType);
			if( matcher.matches() ) {
				this.multimediaClass = MultimediaClass.IMAGE;
			}
		}
	}

	public MultimediaClass getMultimediaClass() {
		return multimediaClass;
	}

	public String getContentType() {
		return contentType;
	}
	
}
