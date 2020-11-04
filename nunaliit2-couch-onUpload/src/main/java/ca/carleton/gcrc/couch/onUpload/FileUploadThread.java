package ca.carleton.gcrc.couch.onUpload;

import ca.carleton.gcrc.couch.client.*;
import ca.carleton.gcrc.couch.onUpload.conversion.*;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachProcessor;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachProcessorImpl;
import ca.carleton.gcrc.couch.onUpload.lookups.UploadsCouchLookups;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.parser.ContentTypeDetector;
import ca.carleton.gcrc.couch.onUpload.parser.FileConverterFactory;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplificationProcessImpl;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifier;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifierDisabled;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifierImpl;
import ca.carleton.gcrc.couch.onUpload.utils.AttachmentUtils;
import ca.carleton.gcrc.couch.onUpload.utils.PluginUtils;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import org.apache.tika.mime.MediaType;
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

    private void activity() {

    }

    @Override
    public void change(Type type, String docId, String rev, JSONObject rawChange, JSONObject doc) {
        // why synchronized?
        synchronized(this) {
            docsInError.removeErrorsWithDocId(docId);
            this.notifyAll();
        }
    }

    /*
     * "waiting for upload"
     * Assigns attachmentName, originalName, submitter, uploadId,
     * "original" structure and "data" structure.
     * Upload id document is deleted from document database.
     * -> "submitted" when upload id is found.
     *
     * "submitted"
     * Assigns value to "original" structure: size, mime type, encoding type. Set file
     * class on attachment.
     * -> "analyzed"
     *
     * "submitted_inline"
     * The state "submitted_inline" was implemented for the iPad application, where the
     * file was attached to the document, but no action from the robot has been taken.
     * In that case, download file to disk and move to regular queue (submitted)
     * -> "submitted"
     *
     * "analyzed"
     * In this phase, the plug-ins are allowed to run. In the case of the multi-media
     * attachments, the thumbnail is created. Conversions are performed.
     * -> "approved" if submitted by a vetter
     * -> "waiting for approval" if submitted by anyone else
     *
     * "waiting for approval"
     * This phase waits for user intervention.
     * -> "approved"
     * -> "denied"
     *
     * "approved"
     * In this phase, the plug-ins are allowed to run. For GPX files, the points are
     * uploaded to the document database.
     * In general, the uploaded file is attached to the document.
     * -> "attached"
     */
    private void performWork(Work work) throws Exception {

        logger.info("Upload worker processing: "+work);

        String state = work.getState();

        if( UploadConstants.UPLOAD_STATUS_WAITING_FOR_UPLOAD.equals(state) ) {
            performWaitingForUploadWork(work);

        } else if( UploadConstants.UPLOAD_STATUS_SUBMITTED.equals(state) ) {
            performSubmittedWork(work);

        } else if( UploadConstants.UPLOAD_STATUS_SUBMITTED_INLINE.equals(state) ) {
            performSubmittedInlineWork(work);

        } else if( UploadConstants.UPLOAD_STATUS_ANALYZED.equals(state) ) {
            // TODO
            System.out.println("STARTED ANALYZING");
            performAnalyzedWork(work);
            System.out.println("FINISHED ANALYZING");

        } else if( UploadConstants.UPLOAD_STATUS_APPROVED.equals(state) ) {
            performApprovedWork(work);

        } else if( UploadConstants.UPLOAD_WORK_ORIENTATION.equals(state) ) {
            performOrientationWork(work);

        } else if( UploadConstants.UPLOAD_WORK_THUMBNAIL.equals(state) ) {
            performThumbnailWork(work);

        } else if( UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE.equals(state) ) {
            performUploadOriginalImageWork(work);

        } else if( UploadConstants.UPLOAD_WORK_ROTATE_CW.equals(state) ) {
            performRotateWork(FileConversionPlugin.WORK_ROTATE_CW, work);

        } else if( UploadConstants.UPLOAD_WORK_ROTATE_CCW.equals(state) ) {
            performRotateWork(FileConversionPlugin.WORK_ROTATE_CCW, work);

        } else if( UploadConstants.UPLOAD_WORK_ROTATE_180.equals(state) ) {
            performRotateWork(FileConversionPlugin.WORK_ROTATE_180, work);

        } else if( UploadConstants.UPLOAD_WORK_SIMPLIFY_GEOMETRY.equals(state) ) {
            performSimplifyGeometryWork(work);

        } else if( UploadConstants.UPLOAD_WORK_INREACH_SUBMIT.equals(state) ) {
            performInReachSubmit(work);

        } else {
            throw new Exception("Unrecognized state: "+state);
        }

        logger.info("Upload worker completed: "+work);
    }

    // TODO: refactor
    private void performWaitingForUploadWork(Work work) throws Exception {

        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);

        DocumentDescriptor docDescriptor = conversionContext.getDocument();

        String uploadId = work.getUploadId();
        AttachmentDescriptor attDescription = docDescriptor.findAttachmentWithUploadId(uploadId);

        String uploadRequestDocId = work.getUploadRequestDocId();
        JSONObject uploadRequestDoc = documentDbDesign.getDatabase().getDocument(uploadRequestDocId);

        attDescription.remove();

        JSONObject uploadRequest = uploadRequestDoc.getJSONObject("nunaliit_upload_request");
        JSONArray files = uploadRequest.getJSONArray("files");

        for(int i=0,e=files.length(); i<e; ++i){
            JSONObject file = files.getJSONObject(i);

            String attachmentName = file.getString("attachmentName");
            String originalName = file.getString("originalName");
            String submitter = file.getString("submitter");
            JSONObject original = file.getJSONObject("original");
            JSONObject data = file.getJSONObject("data");

            String effectiveAttachmentName = AttachmentUtils.computeEffectiveAttachmentName(attachmentName, null);

            int counter = 0;
            while( docDescriptor.isAttachmentDescriptionAvailable(effectiveAttachmentName) ) {
                effectiveAttachmentName = AttachmentUtils.computeEffectiveAttachmentName(attachmentName, counter);
                ++counter;

                if( counter > 100 ){
                    throw new Exception("Unable to compute a new attachment name from: "+attachmentName);
                }
            }

            AttachmentDescriptor requestAttachment =
                    docDescriptor.getAttachmentDescription(effectiveAttachmentName);
            requestAttachment.setStatus(UploadConstants.UPLOAD_STATUS_SUBMITTED);
            requestAttachment.setOriginalName(originalName);
            requestAttachment.setSubmitterName(submitter);
            requestAttachment.setUploadId(uploadId);

            JSONObject jsonAtt = requestAttachment.getJson();
            jsonAtt.put("original", original);
            jsonAtt.put("data", data);
        }

        // Save document
        conversionContext.saveDocument();

        // Delete upload request
        documentDbDesign.getDatabase().deleteDocument(uploadRequestDoc);
    }

    // TODO: refactor
    private void performSubmittedWork(Work work) throws Exception {
        String attachmentName = work.getAttachmentName();

        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);

        DocumentDescriptor docDescriptor = conversionContext.getDocument();

        AttachmentDescriptor attDescription = null;
        if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
            attDescription = docDescriptor.getAttachmentDescription(attachmentName);
        }

        if( null == attDescription ) {
            logger.info("Submission can not be found");

        } else if( false == UploadConstants.UPLOAD_STATUS_SUBMITTED.equals( attDescription.getStatus() ) ) {
            logger.info("File not in submit state");

        } else {
            OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();

            if( null == originalObj) {
                logger.error("Submission does not contain original");
                throw new Exception("Submission does not contain original");
            }

            File file = originalObj.getMediaFile();
            if( null == file ){
                logger.error("No media file reported");
                throw new Exception("No media file reported");
            }
            if( false == file.exists() || false == file.isFile() ){
                logger.info("Uploaded media file does not exist: "+file.getAbsolutePath());

                // Look for original attachment name
                String uploadedAttachmentName = null;
                if( attDescription.isOriginalUpload() ) {
                    // The main attachment is associated with the original uploaded file
                    if( attDescription.isFilePresent() ) {
                        // The attachment is present
                        uploadedAttachmentName = attDescription.getAttachmentName();
                        logger.info("Found original attachment for missing uploaded media: "+uploadedAttachmentName);
                    }
                }
                if( null == uploadedAttachmentName ) {
                    String originalAttachmentName = attDescription.getOriginalAttachment();
                    if( null != originalAttachmentName ) {
                        if( docDescriptor.isAttachmentDescriptionAvailable(originalAttachmentName) ){
                            AttachmentDescriptor originalAttachmentDescription = docDescriptor.getAttachmentDescription(originalAttachmentName);
                            if( originalAttachmentDescription.isFilePresent() ) {
                                // Attachment is available
                                uploadedAttachmentName = originalAttachmentDescription.getAttachmentName();
                                logger.info("Found original attachment for missing uploaded media: "+uploadedAttachmentName);
                            }
                        }
                    }
                }

                // Download file that was originally uploaded
                if( null != uploadedAttachmentName ) {
                    conversionContext.downloadFile(uploadedAttachmentName, file);
                    logger.info("Recovered original file from database: "+uploadedAttachmentName+" to "+file.getName());
                }

                // Check if state was resolved
                if( false == file.exists() || false == file.isFile() ){
                    throw new Exception("Uploaded media file does not exist: "+file.getAbsolutePath());
                }
            }

            // Set file size
            long fileSize = file.length();
            originalObj.setSize(fileSize);

            MediaType mediaType = ContentTypeDetector.detectMimeType(file);
            if (mediaType != null) {
                originalObj.setContentType(mediaType.toString());

                attDescription.setFileClass(ContentTypeDetector.detectNunaliitFileClass(file));
            }

            // Update status
            attDescription.setStatus(UploadConstants.UPLOAD_STATUS_ANALYZED);
            conversionContext.saveDocument();
        }
    }

    /**
     * This function is called when a media file was added on a different
     * node, such as a mobile device. In that case, the media is marked
     * as 'submitted_inline' since the media is already attached to the document
     * but as not yet gone through the process that the robot implements.
     * @param work
     * @throws Exception
     */
    // TODO: clean and refactor
    private void performSubmittedInlineWork(Work work) throws Exception {
        String attachmentName = work.getAttachmentName();

        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);

        DocumentDescriptor docDescriptor = conversionContext.getDocument();

        AttachmentDescriptor attDescription = null;
        if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
            attDescription = docDescriptor.getAttachmentDescription(attachmentName);
        }

        if( null == attDescription ) {
            logger.info("Submission can not be found");

        } else if( false == UploadConstants.UPLOAD_STATUS_SUBMITTED_INLINE.equals( attDescription.getStatus() ) ) {
            logger.info("File not in submit inline state");

        } else {

            // Verify that a file is attached to the document
            if( false == attDescription.isFilePresent() ) {
                // Invalid state
                throw new Exception("Invalid state. A file must be present for submitted_inline");
            }

            // Download file
            File outputFile = File.createTempFile("inline", "", mediaDir);
            conversionContext.downloadFile(attachmentName, outputFile);

            // Create an original structure to point to the file in the
            // media dir. This way, when we go to "submitted" state, we will
            // be ready.
            OriginalFileDescriptor originalDescription = attDescription.getOriginalFileDescription();
            originalDescription.setMediaFileName(outputFile.getName());

            // Delete current attachment
            attDescription.removeFile();

            // Update status
            attDescription.setStatus(UploadConstants.UPLOAD_STATUS_SUBMITTED);
            conversionContext.saveDocument();
        }
    }

    // TODO: clean and refactor
    private void performAnalyzedWork(Work work) throws Exception {
        System.out.println("ASM 1");
        String attachmentName = work.getAttachmentName();
        System.out.println("ASM 2");
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);
        System.out.println("ASM 3");
        DocumentDescriptor docDescriptor = conversionContext.getDocument();
        System.out.println("ASM 4");
        AttachmentDescriptor attDescription = null;
        if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
            attDescription = docDescriptor.getAttachmentDescription(attachmentName);
            System.out.println("ASM 5");
        }
        System.out.println("ASM 6");
        if( null == attDescription ) {
            logger.info("Analysis object not found");

        } else if( false == UploadConstants.UPLOAD_STATUS_ANALYZED.equals( attDescription.getStatus() ) ) {
            logger.info("File not in analyzed state");

        } else {
            if( false == attDescription.isOriginalFileDescriptionAvailable() ) {
                logger.error("Analysis required but original object is not present");
                throw new Exception("Analysis required but original object is not present");
            }
            System.out.println("ASM 7");
            OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();
            System.out.println("ASM 9");
            // Verify if a submitter is specified
            CouchAuthenticationContext submitter = attDescription.getSubmitter();
            System.out.println("ASM 10");
            boolean pluginFound = false;
            String fileClass = attDescription.getFileClass();
            System.out.println("ASM 11");
            FileConversionPlugin plugin = fileConverterFactory.getFileConversionPlugin(fileClass);
            System.out.println("ASM 12");
            if (plugin != null && plugin.handlesFileClass(fileClass, FileConversionPlugin.WORK_ANALYZE)) {
                pluginFound = true;
                System.out.println("ASM 13");
                plugin.performWork(FileConversionPlugin.WORK_ANALYZE, attDescription);
                System.out.println("ASM 14");
            }

            if( false == pluginFound ) {
                logger.info("No plugin found to analyze file class: {}", fileClass);
                System.out.println("ASM 15");
                // By default, original file is used
                attDescription.setOriginalUpload(true);
                attDescription.setMediaFileName(originalObj.getMediaFileName());
                attDescription.setContentType(originalObj.getContentType());
                attDescription.setEncodingType(originalObj.getEncodingType());
                attDescription.setSize(originalObj.getSize());
                System.out.println("ASM 16");
            }

            // Update document
            boolean shouldSendNotification = false;
            if( CouchNunaliitUtils.hasVetterRole(submitter, settings.getAtlasName()) ) {
                System.out.println("ASM 17");
                // If submitter has vetter role, then no need to wait for approval
                attDescription.setStatus(UploadConstants.UPLOAD_STATUS_APPROVED);
            } else {
                attDescription.setStatus(UploadConstants.UPLOAD_STATUS_WAITING_FOR_APPROVAL);
                shouldSendNotification = true;
            }
            conversionContext.saveDocument();
            System.out.println("ASM 18");
            // Notify that upload is available
            if( shouldSendNotification ) {
                sendVettingNotification(work.getDocId(), work.getDocument(), attachmentName);
            }
        }
    }

    // TODO: refactor
    private void performApprovedWork(Work work) throws Exception {
        String attachmentName = work.getAttachmentName();

        FileConversionContext conversionContext =
                new FileConversionContextImpl(work,documentDbDesign,mediaDir);

        DocumentDescriptor docDescriptor = conversionContext.getDocument();

        AttachmentDescriptor attDescription = null;
        if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
            attDescription = docDescriptor.getAttachmentDescription(attachmentName);
        }

        if( null == attDescription ) {
            logger.info("Approved object not found");

        } else if( false == UploadConstants.UPLOAD_STATUS_APPROVED.equals( attDescription.getStatus() ) ) {
            logger.info("File not in approved state");

        } else {
            boolean pluginFound = false;
            String fileClass = attDescription.getFileClass();

            FileConversionPlugin plugin = fileConverterFactory.getFileConversionPlugin(fileClass);
            if (plugin != null && plugin.handlesFileClass(fileClass, FileConversionPlugin.WORK_APPROVE)) {
                pluginFound = true;
                plugin.performWork(FileConversionPlugin.WORK_APPROVE, attDescription);
            }

            if( false == pluginFound ) {
                logger.info("No plugin found for uploaded file class: {}", fileClass);

                String mimeType = attDescription.getContentType();
                if( null == mimeType ) {
                    mimeType = "application/octet-stream";
                }

                // By default, upload original file
                conversionContext.uploadFile(
                        attDescription.getAttachmentName()
                        ,attDescription.getMediaFile()
                        ,mimeType
                );
            }

            // Update status
            attDescription.setStatus(UploadConstants.UPLOAD_STATUS_ATTACHED);
            conversionContext.saveDocument();
        }
    }

    // TODO: refactor
    private void performOrientationWork(Work work) throws Exception {
        FileConversionContext conversionContext =
                new FileConversionContextImpl(work, documentDbDesign, mediaDir);
        final AttachmentDescriptor attachmentDescriptor =
                AttachmentUtils.getAttachmentDescriptor(conversionContext, work);

        if (attachmentDescriptor == null) throw new Exception("Approved object not found");
        if (UploadConstants.UPLOAD_STATUS_ATTACHED.equals(attachmentDescriptor.getStatus()) == false) throw new Exception("File not in attached state");


        if (attachmentDescriptor == null) {
            logger.info("Approved object not found");
        } else if(UploadConstants.UPLOAD_STATUS_ATTACHED.equals(attachmentDescriptor.getStatus()) == false) {
            logger.info("File not in attached state");
        } else {
            ServerWorkDescriptor serverDescription = attachmentDescriptor.getServerWorkDescription();
            int orientationLevel = serverDescription.getOrientationLevel();

            if( orientationLevel >= UploadConstants.SERVER_ORIENTATION_VALUE ) {
                logger.info("Orientation work already done");
            } else {
                boolean pluginFound = false;
                String fileClass = attachmentDescriptor.getFileClass();

                FileConversionPlugin plugin = fileConverterFactory.getFileConversionPlugin(fileClass);
                if (plugin.handlesFileClass(fileClass, FileConversionPlugin.WORK_ORIENT)) {
                    plugin.performWork(FileConversionPlugin.WORK_ORIENT, attachmentDescriptor);
                    pluginFound = true;
                }

                if( false == pluginFound ) {
                    logger.info("No plugin found for uploaded file class: {}", fileClass);
                }

                // Update status
                conversionContext.saveDocument();
            }
        }
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
