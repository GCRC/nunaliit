package ca.carleton.gcrc.couch.submission;

import ca.carleton.gcrc.couch.submission.impl.SubmissionRobotThread;

public class SubmissionRobot {
	
	private SubmissionRobotThread workerThread = null;
	private SubmissionRobotSettings settings = null;

	public SubmissionRobot(SubmissionRobotSettings settings){
		this.settings = settings;
	}
	
	synchronized public void start() throws Exception {
		if( null == settings.getSubmissionDesignDocument() ) {
			throw new Exception("Submission DB design document must be specified for submission worker");
		}
		if( null == settings.getDocumentDesignDocument() ) {
			throw new Exception("Document DB design document must be specified for submission worker");
		}
		if( null == settings.getUserDb() ) {
			throw new Exception("User DB must be specified for submission worker");
		}
		if( null != workerThread ) {
			// Already started
			return;
		}
		workerThread = new SubmissionRobotThread(settings);
		workerThread.start();
	}
	
	synchronized public void stop() throws Exception {
		if( null == workerThread ) {
			return;
		}
		SubmissionRobotThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join();
	}

	synchronized public void stopTimeoutMillis(int millis) throws Exception {
		if( null == workerThread ) {
			return;
		}
		SubmissionRobotThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join(millis);
		thread.interrupt();
	}

}
