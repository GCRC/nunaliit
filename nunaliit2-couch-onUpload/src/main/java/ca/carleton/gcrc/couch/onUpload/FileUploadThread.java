package ca.carleton.gcrc.couch.onUpload;

import ca.carleton.gcrc.couch.client.*;
import ca.carleton.gcrc.couch.onUpload.conversion.*;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachProcessor;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachProcessorImpl;
import ca.carleton.gcrc.couch.onUpload.lookups.UploadsCouchLookups;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.parser.FileConverterFactory;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplificationProcessImpl;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifier;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifierDisabled;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifierImpl;
import ca.carleton.gcrc.couch.onUpload.utils.AttachmentUtils;
import ca.carleton.gcrc.couch.onUpload.utils.PluginUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Vector;

public class FileUploadThread extends Thread implements CouchDbChangeListener {

    final protected Logger logger = LoggerFactory.getLogger(this.getClass());

    private UploadWorkerSettings settings;
    private boolean isShuttingDown = false;
    private CouchDesignDocument documentDbDesign;
    private CouchDesignDocument submissionDbDesign;
    private File mediaDir;
    private MailNotification mailNotification;
    private DocumentsInError docsInError = new DocumentsInError();
    private GeometrySimplifier simplifier = null;
    private InReachProcessor inReachProcessor = null;
    private Properties uploadProperties;
    private FileConverterFactory fileConverterFactory;

    protected FileUploadThread(UploadWorkerSettings settings,
                               CouchDesignDocument documentDbDesign,
                               CouchDesignDocument submissionDbDesign,
                               File mediaDir,
                               MailNotification mailNotification,
                               Properties uploadProperties) throws Exception {
        this.settings = settings;
        this.documentDbDesign = documentDbDesign;
        this.submissionDbDesign = submissionDbDesign;
        this.mediaDir = mediaDir;
        this.mailNotification = mailNotification;
        this.uploadProperties = uploadProperties;

        fileConverterFactory = new FileConverterFactory(this.uploadProperties);
        CouchDbChangeMonitor changeMonitor = documentDbDesign.getDatabase().getChangeMonitor();
        if( null != changeMonitor ){
            changeMonitor.addChangeListener(this);
        }

        if( null != submissionDbDesign ){
            changeMonitor = submissionDbDesign.getDatabase().getChangeMonitor();
            if( null != changeMonitor ){
                changeMonitor.addChangeListener(this);
            }
        }

        if( settings.isGeometrySimplificationDisabled() ){
            simplifier = new GeometrySimplifierDisabled();

        } else {
            List<Double> resolutions = new Vector<Double>();
            resolutions.add(0.00001);
            resolutions.add(0.0001);
            resolutions.add(0.001);
            resolutions.add(0.01);
            resolutions.add(0.1);
            GeometrySimplificationProcessImpl simplifierProcess = new GeometrySimplificationProcessImpl(resolutions);
            simplifier = new GeometrySimplifierImpl(simplifierProcess);
        }

        inReachProcessor = new InReachProcessorImpl();
    }


    @Override
    public void run() {

    }

    @Override
    public void change(Type type, String docId, String rev, JSONObject rawChange, JSONObject doc) {

    }

    private void performThumbnailWork(Work work) throws Exception {
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work, documentDbDesign, mediaDir);
        final AttachmentDescriptor attachmentDescriptor =
                AttachmentUtils.getAttachmentDescriptor(conversionContext, work);

        if (attachmentDescriptor == null) throw new Exception("Approved object not found");
        if (UploadConstants.UPLOAD_STATUS_ATTACHED.equals(attachmentDescriptor.getStatus()) == false) throw new Exception("File not in attached state");

        ServerWorkDescriptor serverDescription = attachmentDescriptor.getServerWorkDescription();
        String thumbnailReference = attachmentDescriptor.getThumbnailReference();
        int thumbnailLevel = serverDescription.getThumbnailLevel();

        if (thumbnailLevel >= UploadConstants.SERVER_THUMBNAIL_VALUE) {
            logger.info("Orientation work already done");
        } else if (thumbnailReference != null) {
            // This is an instance where the thumbnail was already
            // created but the server work was not noted. This happens
            // with legacy documents.
            // In this case, update server work and save document.
            serverDescription.setThumbnailLevel(UploadConstants.SERVER_THUMBNAIL_VALUE);
            // Update status
            conversionContext.saveDocument();
            logger.info("Updated server thumbnail status");
        } else {
            PluginUtils.applyPlugin(FileConversionPlugin.WORK_THUMBNAIL, attachmentDescriptor, fileConverterFactory);
            conversionContext.saveDocument();
        }
    }

    private void performUploadOriginalImageWork(Work work) throws Exception {
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work, documentDbDesign, mediaDir);
        final AttachmentDescriptor attachmentDescriptor =
                AttachmentUtils.getAttachmentDescriptor(conversionContext, work);

        if (attachmentDescriptor == null) throw new Exception("Approved object not found");
        if (UploadConstants.UPLOAD_STATUS_ATTACHED.equals(attachmentDescriptor.getStatus()) == false) throw new Exception("File not in attached state");

        PluginUtils.applyPlugin(FileConversionPlugin.WORK_UPLOAD_ORIGINAL, attachmentDescriptor, fileConverterFactory);
        // Update status
        conversionContext.saveDocument();
    }

    private void performRotateWork(String workType, Work work) throws Exception {
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work, documentDbDesign, mediaDir);
        final AttachmentDescriptor attachmentDescriptor =
                AttachmentUtils.getAttachmentDescriptor(conversionContext, work);

        if (attachmentDescriptor == null) throw new Exception("Approved object not found");
        if (!UploadConstants.UPLOAD_STATUS_ATTACHED.equals(attachmentDescriptor.getStatus())) throw new Exception("File not in attached state");

        PluginUtils.applyPlugin(workType, attachmentDescriptor, fileConverterFactory);
        // Update status
        conversionContext.saveDocument();
    }

    private void performSimplifyGeometryWork(Work work) throws Exception {
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);

        simplifier.simplifyGeometry(conversionContext);
    }

    private void performInReachSubmit(Work work) throws Exception {
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);

        inReachProcessor.performSubmission(conversionContext);
    }

    private void sendVettingNotification(String docId, JSONObject doc, String attachmentName) {
        // Notify that upload is available
        try {
            mailNotification.uploadNotification(docId, attachmentName);
        } catch(Exception e) {
            logger.error("Failed mail notification",e);
        }
    }

    private Work getWork() throws Exception {
        Work work = null;
        if (documentDbDesign != null) { // <- look for work in the documentDbDesign document.
            work = UploadsCouchLookups.lookForWork(documentDbDesign, "server_work", docsInError);
            if (work != null) return work;
        }
        if (submissionDbDesign != null) { // <- look for work in the submissionDbDesign document.
            work = UploadsCouchLookups.lookForWork(submissionDbDesign, "upload-work", docsInError);
            if (work != null) return work;
        }
        return null; // <- nothing found.
    }



}
