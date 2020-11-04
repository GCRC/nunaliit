package ca.carleton.gcrc.couch.onUpload;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationNull;

import java.io.File;
import java.util.Properties;

public class UploadManager {

    private UploadWorkerSettings settings;
    private CouchDesignDocument documentDbDesign = null;
    private CouchDesignDocument submissionDbDesign = null;
    private File mediaDir = null;
    private UploadWorkerThread workerThread = null;
    private MailNotification mailNotification = new MailNotificationNull();
    private Properties uploadProperties;

    public UploadManager(UploadWorkerSettings settings) {
        this.settings = settings;
    }


    // getters and setters
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

}
