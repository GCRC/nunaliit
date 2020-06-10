package ca.carleton.gcrc.couch.onUpload;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationNull;

import java.io.File;
import java.util.Properties;

public class UploadWorker {

	private UploadWorkerSettings settings;
	private CouchDesignDocument documentDbDesign = null;
	private CouchDesignDocument submissionDbDesign = null;
	private File mediaDir = null;
	private UploadWorkerThread workerThread = null;
	private MailNotification mailNotification = new MailNotificationNull();
	private Properties uploadProperties;

	public UploadWorker(UploadWorkerSettings settings) {
		this.settings = settings;
	}
	
	public CouchDesignDocument getDocumentDbDesign() {
		return documentDbDesign;
	}

	public void setDocumentDbDesign(CouchDesignDocument designDocument) {
		this.documentDbDesign = designDocument;
	}
	
	public CouchDesignDocument getSubmissionDbDesign() {
		return submissionDbDesign;
	}

	public void setSubmissionDbDesign(CouchDesignDocument designDocument) {
		this.submissionDbDesign = designDocument;
	}

	public File getMediaDir() {
		return mediaDir;
	}

	public void setMediaDir(File mediaDir) {
		this.mediaDir = mediaDir;
	}
	
	public MailNotification getMailNotification() {
		return mailNotification;
	}

	public void setMailNotification(MailNotification mailNotification) {
		this.mailNotification = mailNotification;
	}
	
	public void setUploadProperties(Properties uploadProperties) {
		this.uploadProperties = uploadProperties;
	}

	synchronized public void start() throws Exception {
		if( null == documentDbDesign ) {
			throw new Exception("Design document must be specified for upload worker");
		}
		if( null == mediaDir ) {
			throw new Exception("Media directory must be specified for upload worker");
		}
		if( null == mailNotification ) {
			throw new Exception("Mail notifier must be specified for upload worker");
		}
		if( null != workerThread ) {
			// Already started
			return;
		}
		workerThread = new UploadWorkerThread(
				settings
				,documentDbDesign
				,submissionDbDesign
				,mediaDir
				,mailNotification
				,uploadProperties);
		workerThread.start();
	}
	
	synchronized public void stop() throws Exception {
		if( null == workerThread ) {
			return;
		}
		UploadWorkerThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join();
	}

	public void stopTimeoutMillis(int millis) throws Exception {
		if( null == workerThread ) {
			return;
		}
		UploadWorkerThread thread = workerThread;
		workerThread = null;

		thread.shutdown();
		thread.join(millis);
		thread.interrupt();
	}
}
