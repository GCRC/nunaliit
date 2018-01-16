package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.impl.CouchDbException;
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContextImpl;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.ServerWorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.WorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachProcessor;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachProcessorImpl;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionMetaData;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplificationProcessImpl;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifier;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifierDisabled;
import ca.carleton.gcrc.couch.onUpload.simplifyGeoms.GeometrySimplifierImpl;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;

public class UploadWorkerThread extends Thread implements CouchDbChangeListener {
	
	static final public int DELAY_NO_WORK_POLLING = 5 * 1000; // 5 seconds
	static final public int DELAY_NO_WORK_MONITOR = 60 * 1000; // 1 minute
	static final public int DELAY_ERROR = 60 * 1000; // 1 minute
	static final public int DELAY_CLEAR_OLD_ERRORS = 5 * 60 * 1000; // 5 minutes

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private UploadWorkerSettings settings;
	private boolean isShuttingDown = false;
	private CouchDesignDocument documentDbDesign;
	private CouchDesignDocument submissionDbDesign;
	private File mediaDir;
	private MailNotification mailNotification;
	private DocumentsInError docsInError = new DocumentsInError();
	private List<FileConversionPlugin> fileConverters;
	private int noWorkDelayInMs = DELAY_NO_WORK_POLLING;
	private GeometrySimplifier simplifier = null;
	private InReachProcessor inReachProcessor = null;
	
	protected UploadWorkerThread(
		UploadWorkerSettings settings
		,CouchDesignDocument documentDbDesign
		,CouchDesignDocument submissionDbDesign
		,File mediaDir
		,MailNotification mailNotification
		,List<FileConversionPlugin> fileConverters
		) throws Exception {
		this.settings = settings;
		this.documentDbDesign = documentDbDesign;
		this.submissionDbDesign = submissionDbDesign;
		this.mediaDir = mediaDir;
		this.mailNotification = mailNotification;
		this.fileConverters = fileConverters;
		
		noWorkDelayInMs = DELAY_NO_WORK_POLLING;
		CouchDbChangeMonitor changeMonitor = documentDbDesign.getDatabase().getChangeMonitor();
		if( null != changeMonitor ){
			changeMonitor.addChangeListener(this);
			noWorkDelayInMs = DELAY_NO_WORK_MONITOR;
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
	
	public void shutdown() {
		
		logger.info("Shutting down upload worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start upload worker thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("Upload worker thread exiting");
	}
	
	private void activity() {
		Work work = null;
		try {
			work = getWork();
		} catch (Exception e) {
			logger.error("Error accessing server",e);
			waitMillis(DELAY_ERROR); // wait a minute
			return;
		}
		
		if( null == work ) {
			// Nothing to do, remove old errors
			List<String> docIdsRecovered = docsInError.removeErrorsOlderThanMs(DELAY_CLEAR_OLD_ERRORS);

			if( docIdsRecovered.size() <= 0 ) {
				// No errors to get rid of and no work, wait
				waitMillis(noWorkDelayInMs);
				return;
			}
		} else {
			try {
				// Handle this work
				performWork(work);
				
			} catch(Exception e) {
				boolean shouldErrorBeTakenIntoAccount = true;
				for(Throwable t : errorAndCausesAsList(e)){
					if( t instanceof CouchDbException ){
						CouchDbException couchDbException = (CouchDbException)t;
						if( 409 == couchDbException.getReturnCode() ){
							// This is a conflict error in CouchDb. Somebody is updating the document
							// at the same time. Just retry the worl
							shouldErrorBeTakenIntoAccount = false;
						}
					}
				}
				
				logger.error("Error processing document "+work.getDocId()+" ("+work.getState()+")",e);

				if( shouldErrorBeTakenIntoAccount ){
					synchronized(this) {
						docsInError.addDocumentInError( work.getDocId() );
					}
				} else {
					logger.info("Previous error for "+work.getDocId()+" will be ignored. Should retry shortly.");
				}
			}
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
			performAnalyzedWork(work);
			
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
			
			String effectiveAttachmentName = computeEffectiveAttachmentName(attachmentName, null);

			int counter = 0;
			while( docDescriptor.isAttachmentDescriptionAvailable(effectiveAttachmentName) ) {
				effectiveAttachmentName = computeEffectiveAttachmentName(attachmentName, counter);
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
					logger.info("Recovered original file from database: "+uploadedAttachmentName);
				}

				// Check if state was resolved
				if( false == file.exists() || false == file.isFile() ){
					throw new Exception("Uploaded media file does not exist: "+file.getAbsolutePath());
				}
			};

			// Set file size
			long fileSize = file.length();
			originalObj.setSize(fileSize);

			// Mime type, encoding type and file class
			boolean pluginFound = false;
			String mimeType = null;
			String mimeEncoding = null;
			String fileClass = null;
			for(FileConversionPlugin fcp : this.fileConverters) {
				FileConversionMetaData md = fcp.getFileMetaData(file);
				if( md.isFileConvertable() ) {
					mimeType = md.getMimeType();
					fileClass = md.getFileClass();
					mimeEncoding = md.getMimeEncoding();
	
					pluginFound = true;
					break;
				}
			}
			if( false == pluginFound ) {
				logger.info("No plugin found for uploaded file");
				
				SystemFile sf = SystemFile.getSystemFile(file);
				mimeType = sf.getMimeType();
				mimeEncoding = sf.getMimeEncoding();
			}
			if( null != mimeType ) {
				originalObj.setContentType(mimeType);
			}
			if( null != mimeEncoding ) {
				originalObj.setEncodingType(mimeEncoding);
			}
			if( null != fileClass ){
				attDescription.setFileClass(fileClass);
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
	 * @param docId
	 * @param attachmentName
	 * @throws Exception
	 */
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

	private void performAnalyzedWork(Work work) throws Exception {
		String attachmentName = work.getAttachmentName();

		FileConversionContext conversionContext = 
			new FileConversionContextImpl(work,documentDbDesign,mediaDir);

		DocumentDescriptor docDescriptor = conversionContext.getDocument();

		AttachmentDescriptor attDescription = null;
		if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
			attDescription = docDescriptor.getAttachmentDescription(attachmentName);
		}
		
		if( null == attDescription ) {
			logger.info("Analysis object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ANALYZED.equals( attDescription.getStatus() ) ) {
			logger.info("File not in analyzed state");
			
		} else {
			if( false == attDescription.isOriginalFileDescriptionAvailable() ) {
				logger.error("Analysis required but original object is not present");
				throw new Exception("Analysis required but original object is not present");
			}
			OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();
			
			// Verify if a submitter is specified
			CouchAuthenticationContext submitter = attDescription.getSubmitter();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_ANALYZE) ) {
					fcp.performWork(FileConversionPlugin.WORK_ANALYZE, attDescription);
					pluginFound = true;
					break;
				}
			}
			if( false == pluginFound ) {
				logger.info("No plugin found to analyze file class: "+fileClass);
				
				// By default, original file is used
				attDescription.setOriginalUpload(true);
				attDescription.setMediaFileName(originalObj.getMediaFileName());
				attDescription.setContentType(originalObj.getContentType());
				attDescription.setEncodingType(originalObj.getEncodingType());
				attDescription.setSize(originalObj.getSize());
			}
			
			// Update document
			boolean shouldSendNotification = false;
			if( CouchNunaliitUtils.hasVetterRole(submitter, settings.getAtlasName()) ) {
				// If submitter has vetter role, then no need to wait for approval
				attDescription.setStatus(UploadConstants.UPLOAD_STATUS_APPROVED);
			} else {
				attDescription.setStatus(UploadConstants.UPLOAD_STATUS_WAITING_FOR_APPROVAL);
				shouldSendNotification = true;
			}
			conversionContext.saveDocument();
			
			// Notify that upload is available
			if( shouldSendNotification ) {
				sendVettingNotification(work.getDocId(), work.getDocument(), attachmentName);
			}
		}
	}

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
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_APPROVE) ) {
					fcp.performWork(FileConversionPlugin.WORK_APPROVE, attDescription);
					pluginFound = true;
					break;
				}
			}
			if( false == pluginFound ) {
				logger.info("No plugin found for uploaded file class: "+fileClass);
				
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
	
	private void performOrientationWork(Work work) throws Exception {
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

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( attDescription.getStatus() ) ) {
			logger.info("File not in attached state");

		} else {
			ServerWorkDescriptor serverDescription = attDescription.getServerWorkDescription();
			int orientationLevel = serverDescription.getOrientationLevel();
			
			if( orientationLevel >= UploadConstants.SERVER_ORIENTATION_VALUE ) {
				logger.info("Orientation work already done");
			} else {
				boolean pluginFound = false;
				String fileClass = attDescription.getFileClass();
				for(FileConversionPlugin fcp : this.fileConverters) {
					if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_ORIENT) ) {
						fcp.performWork(FileConversionPlugin.WORK_ORIENT, attDescription);
						pluginFound = true;
						break;
					}
				}
				if( false == pluginFound ) {
					logger.info("No plugin found for uploaded file class: "+fileClass);
				}
	
				// Update status
				conversionContext.saveDocument();
			}
		}
	}
	
	private void performThumbnailWork(Work work) throws Exception {
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

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( attDescription.getStatus() ) ) {
			logger.info("File not in attached state");

		} else {
			ServerWorkDescriptor serverDescription = attDescription.getServerWorkDescription();
			String thumbnailReference = attDescription.getThumbnailReference();
			int thumbnailLevel = serverDescription.getThumbnailLevel();
			
			if( thumbnailLevel >= UploadConstants.SERVER_THUMBNAIL_VALUE ) {
				logger.info("Orientation work already done");
	
			} else if( null != thumbnailReference ) {
				// This is an instance where the thumbnail was already
				// created but the server work was not noted. This happens
				// with legacy documents. 
				// In this case, update server work and save document.
				serverDescription.setThumbnailLevel(UploadConstants.SERVER_THUMBNAIL_VALUE);
				
				// Update status
				conversionContext.saveDocument();
				
				logger.info("Updated server thumbnail status");

			} else {

				boolean pluginFound = false;
				String fileClass = attDescription.getFileClass();
				for(FileConversionPlugin fcp : this.fileConverters) {
					if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_THUMBNAIL) ) {
						fcp.performWork(FileConversionPlugin.WORK_THUMBNAIL, attDescription);
						pluginFound = true;
						
						logger.info("Created thumbnail");
						break;
					}
				}
				if( false == pluginFound ) {
					logger.info("No plugin found for thumbnail creation, file class: "+fileClass);
				}

				// Update status
				conversionContext.saveDocument();
			}
		}
	}
	
	private void performUploadOriginalImageWork(Work work) throws Exception {
		String attachmentName = work.getAttachmentName();
		
		FileConversionContext conversionContext = 
			new FileConversionContextImpl(work,documentDbDesign,mediaDir);

		DocumentDescriptor docDescriptor = conversionContext.getDocument();

		AttachmentDescriptor attDescription = null;
		if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
			attDescription = docDescriptor.getAttachmentDescription(attachmentName);
		}

		if( null == attDescription ) {
			throw new Exception("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( attDescription.getStatus() ) ) {
			throw new Exception("File not in attached state");

		} else {
			WorkDescriptor workDescription = attDescription.getWorkDescription();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_UPLOAD_ORIGINAL) ) {
					fcp.performWork(FileConversionPlugin.WORK_UPLOAD_ORIGINAL, attDescription);
					pluginFound = true;
					
					logger.info("Original file uploaded");
					break;
				}
			}
			if( false == pluginFound ) {
				workDescription.setStringAttribute(UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE, "No plugin found for thumbnail creation, file class: "+fileClass);
			}

			// Update status
			conversionContext.saveDocument();
		}
	}
	
	private void performRotateWork(String workType, Work work) throws Exception {
		String attachmentName = work.getAttachmentName();
		
		FileConversionContext conversionContext = 
			new FileConversionContextImpl(work,documentDbDesign,mediaDir);

		DocumentDescriptor docDescriptor = conversionContext.getDocument();

		AttachmentDescriptor attDescription = null;
		if( docDescriptor.isAttachmentDescriptionAvailable(attachmentName) ){
			attDescription = docDescriptor.getAttachmentDescription(attachmentName);
		}

		if( null == attDescription ) {
			throw new Exception("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( attDescription.getStatus() ) ) {
			throw new Exception("File not in attached state");

		} else {
			WorkDescriptor workDescription = attDescription.getWorkDescription();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, workType) ) {
					fcp.performWork(workType, attDescription);
					pluginFound = true;
					
					logger.info("Rotation work complete: "+workType);
					break;
				}
			}
			if( false == pluginFound ) {
				workDescription.setStringAttribute(UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE, "No plugin found for thumbnail creation, file class: "+fileClass);
			}

			// Update status
			conversionContext.saveDocument();
		}
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
//			String title = "Vetting Request";
//			String description = "A file has been submitted for approval and requires your vetting action.";
			
			mailNotification.uploadNotification(docId, attachmentName);
			
		} catch(Exception e) {
			logger.error("Failed mail notification",e);
		}
	}
	
	private Work getWork() throws Exception {
		Map<String,JSONObject> rowsByUploadId = null;

		// Deal with document database
		{
			CouchQuery query = new CouchQuery();
			query.setViewName("server_work");
			
			CouchQueryResults results;
			results = documentDbDesign.performQuery(query);
			rowsByUploadId = findUploadIds(results);
					
			for(JSONObject row : results.getRows()) {
				String id = row.optString("id");
				
				String state = null;
				String attachmentName = null;
				JSONArray key = row.optJSONArray("key");
				if( null != key ){
					if( key.length() > 0 ){
						state = key.getString(0);
					}
					if( key.length() > 1 ){
						attachmentName = key.getString(1);
					}
				};
				
				// Discount documents in error state
				synchronized(this) {
					if( docsInError.isDocumentInError(id) ) {
						continue;
					}
				}
				
				if( UploadConstants.UPLOAD_STATUS_WAITING_FOR_UPLOAD.equals(state) ) {
					// In the case of "waiting_for_upload", the attachment name
					// refers to the uploadId
					JSONObject uploadIdRow = rowsByUploadId.get(attachmentName);
					if( null == uploadIdRow ) {
						// Missing information to continue
						continue;
					} else {
						String uploadRequestDocId = uploadIdRow.getString("id");
						
						WorkDocumentDb work = new WorkDocumentDb(documentDbDesign, state, id);
						work.setUploadId(attachmentName);
						work.setUploadRequestDocId(uploadRequestDocId);
						return work;
					}
					
				} else if( UploadConstants.UPLOAD_WORK_UPLOADED_FILE.equals(state) ) {
					// Ignore
					continue;
					
				} else {
					// Everything else
					WorkDocumentDb work = new WorkDocumentDb(documentDbDesign, state, id);
					work.setAttachmentName(attachmentName);
					return work;
				}
			}
		}
		
		// At this point, no work found in the document database. Look in the
		// submission database, if present
		if( null != submissionDbDesign ){
			CouchQuery query = new CouchQuery();
			query.setViewName("upload-work");
			
			CouchQueryResults results = submissionDbDesign.performQuery(query);
			
			for(JSONObject row : results.getRows()) {
				String id = row.optString("id");
				
				String state = null;
				String uploadId = null;
				JSONArray key = row.optJSONArray("key");
				if( null != key ){
					if( key.length() > 0 ){
						state = key.getString(0);
					}
					if( key.length() > 1 ){
						uploadId = key.getString(1);
					}
				};
				
				// Discount documents in error state
				synchronized(this) {
					if( docsInError.isDocumentInError(id) ) {
						continue;
					}
				}
				
				if( UploadConstants.UPLOAD_STATUS_WAITING_FOR_UPLOAD.equals(state) ) {
					// In the case of "waiting_for_upload", the attachment name
					// refers to the uploadId
					JSONObject uploadIdRow = rowsByUploadId.get(uploadId);
					if( null == uploadIdRow ) {
						// Missing information to continue
						continue;
					} else {
						String uploadRequestDocId = uploadIdRow.getString("id");
						
						WorkSubmissionDb work = new WorkSubmissionDb(submissionDbDesign, state, id);
						work.setUploadId(uploadId);
						work.setUploadRequestDocId(uploadRequestDocId);
						return work;
					}
					
				} else {
					// Everything else
					WorkSubmissionDb work = new WorkSubmissionDb(submissionDbDesign, state, id);
					work.setAttachmentName(uploadId);
					return work;
				}
			}
		}

		return null;
	}
	
	private Map<String,JSONObject> findUploadIds(CouchQueryResults results) throws Exception {
		Map<String,JSONObject> rowsByUploadId = new HashMap<String,JSONObject>();
		
		for(JSONObject row : results.getRows()) {
			String state = null;
			String uploadId = null;
			JSONArray key = row.optJSONArray("key");
			if( null != key ){
				if( key.length() > 0 ){
					state = key.getString(0);
				}
				if( key.length() > 1 ){
					uploadId = key.getString(1);
				}
			};
			
			if( UploadConstants.UPLOAD_WORK_UPLOADED_FILE.equals(state) ) {
				rowsByUploadId.put(uploadId, row);
			}
		}
		
		return rowsByUploadId;
	}
	
	private String computeEffectiveAttachmentName(String attachmentName, Integer counter){
		String prefix = "";
		String suffix = "";
		int pos = attachmentName.indexOf('.', 1);
		if( pos < 0 ) {
			prefix = attachmentName;
		} else {
			prefix = attachmentName.substring(0, pos);
			suffix = attachmentName.substring(pos);
		}
		
		// Remove leading '_' from prefix
		while( prefix.length() > 0 && prefix.charAt(0) == '_' ){
			prefix = prefix.substring(1);
		}
		if( prefix.length() < 1 ){
			prefix = "a";
		}
		String effectiveAttachmentName = null;
		if( null != counter ){
			effectiveAttachmentName = prefix + "." + counter + suffix;
		} else {
			effectiveAttachmentName = prefix + suffix;
		}
		
		return effectiveAttachmentName;
	}
	
	private boolean waitMillis(int millis) {
		synchronized(this) {
			if( true == isShuttingDown ) {
				return false;
			}
			
			try {
				this.wait(millis);
			} catch (InterruptedException e) {
				// Interrupted
				return false;
			}
		}
		
		return true;
	}

	@Override
	public void change(
			CouchDbChangeListener.Type type
			,String docId
			,String rev
			,JSONObject rawChange
			,JSONObject doc) {

		synchronized(this) {
			docsInError.removeErrorsWithDocId(docId);
			this.notifyAll();
		}
	}
	
	private List<Throwable> errorAndCausesAsList(Throwable e){
		List<Throwable> errors = new Vector<Throwable>();
		
		errors.add(e);
		
		// Add causes
		Throwable cause = e.getCause();
		while( null != cause && errors.indexOf(cause) < 0 ){
			errors.add(cause);
			cause = e.getCause();
		}
		
		return errors;
	};
}
