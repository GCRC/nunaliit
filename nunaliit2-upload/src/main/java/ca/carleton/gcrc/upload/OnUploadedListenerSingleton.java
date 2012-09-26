package ca.carleton.gcrc.upload;

public class OnUploadedListenerSingleton {

	static private OnUploadedListenerWrapper singleton = 
		new OnUploadedListenerWrapper( new OnUploadedListenerNull() );
	
	static public OnUploadedListener getSingleton() {
		return singleton;
	}
	
	static public void configure(OnUploadedListener listener) {
		singleton.setWrapped(listener);
	}
}
