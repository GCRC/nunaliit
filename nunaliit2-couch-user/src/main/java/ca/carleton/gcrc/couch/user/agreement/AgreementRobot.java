package ca.carleton.gcrc.couch.user.agreement;

public class AgreementRobot {
	
	private AgreementRobotThread workerThread = null;
	private AgreementRobotSettings settings = null;

	public AgreementRobot(AgreementRobotSettings settings){
		this.settings = settings;
	}
	
	synchronized public void start() throws Exception {
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
		workerThread = new AgreementRobotThread(settings);
		workerThread.start();
	}
	
	synchronized public void stop() throws Exception {
		if( null == workerThread ) {
			return;
		}
		AgreementRobotThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join();
	}

	synchronized public void stopTimeoutMillis(int millis) throws Exception {
		if( null == workerThread ) {
			return;
		}
		AgreementRobotThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join(millis);
		thread.interrupt();
	}

}
