package ca.carleton.gcrc.olkit.multimedia.utils;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MimeUtils {

	public static final String TYPE_AUDIO = "audio";
	public static final String TYPE_VIDEO = "video";
	public static final String TYPE_IMAGE = "image";

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

	static private Pattern patternAudio = Pattern.compile("audio/.*");
	static private Pattern patternVideo = Pattern.compile("video/.*");
	static private Pattern patternImage = Pattern.compile("image/.*");

	static private Set<String> g_audioMimeTypes = null;
	static private Set<String> g_videoMimeTypes = null;
	static private Set<String> g_imageMimeTypes = null;
	
	static synchronized public Set<String> getKnownAudioMimeTypes() {
		if( null == g_audioMimeTypes ) {
			g_audioMimeTypes = new HashSet<String>();
			g_audioMimeTypes.add("application/ogg");
		}
		
		return g_audioMimeTypes;
	}
	
	static synchronized public Set<String> getKnownVideoMimeTypes() {
		if( null == g_videoMimeTypes ) {
			g_videoMimeTypes = new HashSet<String>();
		}
		
		return g_videoMimeTypes;
	}
	
	static synchronized public Set<String> getKnownImageMimeTypes() {
		if( null == g_imageMimeTypes ) {
			g_imageMimeTypes = new HashSet<String>();
		}
		
		return g_imageMimeTypes;
	}

	static public void addKnownAudioMimeType(String type) {
		Set<String> known = getKnownAudioMimeTypes();
		synchronized(known) {
			known.add(type);
		}
	}

	static public void addKnownVideoMimeType(String type) {
		Set<String> known = getKnownVideoMimeTypes();
		synchronized(known) {
			known.add(type);
		}
	}

	static public void addKnownImageMimeType(String type) {
		Set<String> known = getKnownImageMimeTypes();
		synchronized(known) {
			known.add(type);
		}
	}
	
	static public MultimediaClass getMultimediaClassFromMimeType(String mimeType) {
		{
			Matcher matcher = patternAudio.matcher(mimeType);
			if( matcher.matches() ) {
				return MultimediaClass.AUDIO;
			}
		}
		{
			Matcher matcher = patternVideo.matcher(mimeType);
			if( matcher.matches() ) {
				return MultimediaClass.VIDEO;
			}
		}
		{
			Matcher matcher = patternImage.matcher(mimeType);
			if( matcher.matches() ) {
				return MultimediaClass.IMAGE;
			}
		}
		{
			Set<String> known = getKnownAudioMimeTypes();
			synchronized(known) {
				if( known.contains(mimeType) ) return MultimediaClass.AUDIO;
			}
		}
		{
			Set<String> known = getKnownVideoMimeTypes();
			synchronized(known) {
				if( known.contains(mimeType) ) return MultimediaClass.VIDEO;
			}
		}
		{
			Set<String> known = getKnownImageMimeTypes();
			synchronized(known) {
				if( known.contains(mimeType) ) return MultimediaClass.IMAGE;
			}
		}
		return null;
	}
	
	static public MultimediaClass getMultimediaClassFromClassString(String classStr) {
		for(MultimediaClass mmClass : MultimediaClass.values()) {
			if( mmClass.getValue().equals(classStr) ) {
				return mmClass;
			}
		}
		return null;
	}
}
