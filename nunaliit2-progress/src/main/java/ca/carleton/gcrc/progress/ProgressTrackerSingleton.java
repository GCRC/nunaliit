package ca.carleton.gcrc.progress;

public class ProgressTrackerSingleton {

	static private ProgressTrackerWrapper wrapped =  
		new ProgressTrackerWrapper( new ProgressTrackerImpl() );
	
	static public ProgressTracker getSingleton() {
		return wrapped;
	}
	
	static public void configure(ProgressTracker progressTracker) {
		wrapped.setWrapped(progressTracker);
	}
}
