package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.ServerWorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.WorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionMetaData;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;

public class UploadWorkerThread extends Thread {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private UploadWorkerSettings settings;
	private boolean isShuttingDown = false;
	private CouchDesignDocument dd;
	private File mediaDir;
	private MailNotification mailNotification;
	private Set<String> docIdsToSkip = new HashSet<String>();
	private List<FileConversionPlugin> fileConverters;
	
	protected UploadWorkerThread(
		UploadWorkerSettings settings
		,CouchDesignDocument dd
		,File mediaDir
		,MailNotification mailNotification
		,List<FileConversionPlugin> fileConverters
		) {
		this.settings = settings;
		this.dd = dd;
		this.mediaDir = mediaDir;
		this.mailNotification = mailNotification;
		this.fileConverters = fileConverters;
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
		CouchQuery query = new CouchQuery();
		query.setViewName("server_work");
		
		CouchQueryResults results;
		try {
			results = dd.performQuery(query);
		} catch (Exception e) {
			logger.error("Error accessing server",e);
			waitMillis(60 * 1000); // wait a minute
			return;
		}
		
		// Check for work
		String docId = null;
		JSONArray state = null;
		for(JSONObject row : results.getRows()) {
			String id = row.optString("id");
			if( false == docIdsToSkip.contains(id) ) {
				// Found some work
				docId = id;
				state = row.optJSONArray("key");
				break;
			}
		}
		
		if( null == docId ) {
			// Nothing to do, wait 5 secs
			waitMillis(5 * 1000);
			return;
		} else {
			try {
				// Handle this work
				performWork(docId, state);
				
			} catch(Exception e) {
				logger.error("Error processing document "+docId+" ("+state+")",e);
				docIdsToSkip.add(docId);
			}
		}
	}
	
	private void performWork(String docId, JSONArray state) throws Exception {
		
		logger.info("Upload worker thread processing: "+docId+" ("+state+")");
		
		String work = state.getString(0);
		
		if( UploadConstants.UPLOAD_STATUS_SUBMITTED.equals(work) ) {
			String attachmentName = state.getString(1);
			performSubmittedWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_STATUS_SUBMITTED_INLINE.equals(work) ) {
			String attachmentName = state.getString(1);
			performSubmittedInlineWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_STATUS_ANALYZED.equals(work) ) {
			String attachmentName = state.getString(1);
			performAnalyzedWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_STATUS_APPROVED.equals(work) ) {
			String attachmentName = state.getString(1);
			performApprovedWork(docId, attachmentName);
				
		} else if( UploadConstants.UPLOAD_WORK_ORIENTATION.equals(work) ) {
			String attachmentName = state.getString(1);
			performOrientationWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_THUMBNAIL.equals(work) ) {
			String attachmentName = state.getString(1);
			performThumbnailWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE.equals(work) ) {
			String attachmentName = state.getString(1);
			performUploadOriginalImageWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_ROTATE_CW.equals(work) ) {
			String attachmentName = state.getString(1);
			performRotateWork(FileConversionPlugin.WORK_ROTATE_CW, docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_ROTATE_CCW.equals(work) ) {
			String attachmentName = state.getString(1);
			performRotateWork(FileConversionPlugin.WORK_ROTATE_CCW, docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_ROTATE_180.equals(work) ) {
			String attachmentName = state.getString(1);
			performRotateWork(FileConversionPlugin.WORK_ROTATE_180, docId, attachmentName);
			
		} else {
			throw new Exception("Unrecognized state: "+state);
		}

		logger.info("Upload worker thread completed: "+docId+" ("+state+")");
	}

	private void performSubmittedWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);

		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);
		
		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			logger.info("Submission can not be found");

		} else if( false == UploadConstants.UPLOAD_STATUS_SUBMITTED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			logger.info("File not in submit state");
			
		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();
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
				logger.error(""+file.getAbsolutePath()+" is not a file.");
				throw new Exception(""+file.getAbsolutePath()+" is not a file.");
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
	private void performSubmittedInlineWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);

		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);
		
		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			logger.info("Submission can not be found");

		} else if( false == UploadConstants.UPLOAD_STATUS_SUBMITTED_INLINE.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			logger.info("File not in submit inline state");
			
		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();

			// Verify that a file is attached to the document
			if( false == attDescription.isFilePresent() ) {
				// Invalid state
				throw new Exception("Invalid state. A file must be present for submitted_inline");
			}
			
			// Download file
			File outputFile = File.createTempFile("inline", "", mediaDir);
			conversionContext.downloadFile(outputFile);
			
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

	private void performAnalyzedWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);

		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);
		
		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			logger.info("Analysis object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ANALYZED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			logger.info("File not in analyzed state");
			
		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();

			if( false == attDescription.isOriginalFileDescriptionAvailable() ) {
				logger.error("Analysis required but original object is not present");
				throw new Exception("Analysis required but original object is not present");
			}
			OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();
			
			// Verify if a submitter is specified
			CouchUserContext submitter = attDescription.getSubmitter();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_ANALYZE) ) {
					fcp.performWork(FileConversionPlugin.WORK_ANALYZE, conversionContext);
					pluginFound = true;
					break;
				}
			}
			if( false == pluginFound ) {
				logger.info("No plugin found to analyze file class: "+fileClass);
				
				// By default, original file is used
				attDescription.setMediaFileName(originalObj.getMediaFileName());
				attDescription.setContentType(originalObj.getContentType());
				attDescription.setEncodingType(originalObj.getEncodingType());
				attDescription.setSize(originalObj.getSize());
			}
			
			// Update document
			if( CouchNunaliitUtils.hasVetterRole(submitter, settings.getAtlasName()) ) {
				// If submitter has vetter role, then no need to wait for approval
				attDescription.setStatus(UploadConstants.UPLOAD_STATUS_APPROVED);
			} else {
				attDescription.setStatus(UploadConstants.UPLOAD_STATUS_WAITING_FOR_APPROVAL);
			}
			conversionContext.saveDocument();
			
			// Notify that upload is available
			sendContributionApprovalRequest(docId, doc, attachmentName);
		}
	}

	private void performApprovedWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);
		
		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);

		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			logger.info("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_APPROVED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			logger.info("File not in approved state");
			
		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_APPROVE) ) {
					fcp.performWork(FileConversionPlugin.WORK_APPROVE, conversionContext);
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
					conversionContext.getAttachmentName()
					,attDescription.getMediaFile()
					,mimeType
					);
			}

			// Update status
			attDescription.setStatus(UploadConstants.UPLOAD_STATUS_ATTACHED);
			conversionContext.saveDocument();
		}
	}
	
	private void performOrientationWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);
		
		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);

		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			logger.info("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			logger.info("File not in attached state");

		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();
			ServerWorkDescriptor serverDescription = attDescription.getServerWorkDescription();
			int orientationLevel = serverDescription.getOrientationLevel();
			
			if( orientationLevel >= UploadConstants.SERVER_ORIENTATION_VALUE ) {
				logger.info("Orientation work already done");
			} else {
				boolean pluginFound = false;
				String fileClass = attDescription.getFileClass();
				for(FileConversionPlugin fcp : this.fileConverters) {
					if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_ORIENT) ) {
						fcp.performWork(FileConversionPlugin.WORK_ORIENT, conversionContext);
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
	
	private void performThumbnailWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);
		
		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);

		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			logger.info("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			logger.info("File not in attached state");

		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();
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
						fcp.performWork(FileConversionPlugin.WORK_THUMBNAIL, conversionContext);
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
	
	private void performUploadOriginalImageWork(String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);
		
		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);

		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			throw new Exception("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			throw new Exception("File not in attached state");

		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();
			WorkDescriptor work = attDescription.getWorkDescription();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, FileConversionPlugin.WORK_UPLOAD_ORIGINAL) ) {
					fcp.performWork(FileConversionPlugin.WORK_UPLOAD_ORIGINAL, conversionContext);
					pluginFound = true;
					
					logger.info("Original file uploaded");
					break;
				}
			}
			if( false == pluginFound ) {
				work.setStringAttribute(UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE, "No plugin found for thumbnail creation, file class: "+fileClass);
			}

			// Update status
			conversionContext.saveDocument();
		}
	}
	
	private void performRotateWork(String workType, String docId, String attachmentName) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);
		
		FileConversionContext conversionContext = 
			new FileConversionContext(doc,dd,attachmentName,mediaDir);

		if( false == conversionContext.isAttachmentDescriptionAvailable() ) {
			throw new Exception("Approved object not found");

		} else if( false == UploadConstants.UPLOAD_STATUS_ATTACHED.equals( conversionContext.getAttachmentDescription().getStatus() ) ) {
			throw new Exception("File not in attached state");

		} else {
			AttachmentDescriptor attDescription = conversionContext.getAttachmentDescription();
			WorkDescriptor work = attDescription.getWorkDescription();

			boolean pluginFound = false;
			String fileClass = attDescription.getFileClass();
			for(FileConversionPlugin fcp : this.fileConverters) {
				if( fcp.handlesFileClass(fileClass, workType) ) {
					fcp.performWork(workType, conversionContext);
					pluginFound = true;
					
					logger.info("Rotation work complete: "+workType);
					break;
				}
			}
			if( false == pluginFound ) {
				work.setStringAttribute(UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE, "No plugin found for thumbnail creation, file class: "+fileClass);
			}

			// Update status
			conversionContext.saveDocument();
		}
	}
	
	private void sendContributionApprovalRequest(String docId, JSONObject doc, String attachmentName) {
		// Notify that upload is available
		try {
			String title = "[not set]";
			String description = "[not set]";
			
			JSONObject contributionObj = doc.optJSONObject("nunaliit_contribution");
			if( null != contributionObj ) {
				if( contributionObj.has("title") ) {
					title = contributionObj.getString("title");
				}
				if( contributionObj.has("description") ) {
					description = contributionObj.getString("description");
				}
			}
			
			mailNotification.uploadNotification(docId, title, description, attachmentName);
			
		} catch(Exception e) {
			logger.error("Failed mail notification",e);
		}
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
}
