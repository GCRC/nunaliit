package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.ServerWorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.WorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionMetaData;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;

public class UploadWorkerThread extends Thread implements CouchDbChangeListener {
	
	static final public int WORK_DELAY_POLLING = 5 * 1000; // 5 seconds
	static final public int WORK_DELAY_MONITOR = 60 * 1000; // 1 minute

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private UploadWorkerSettings settings;
	private boolean isShuttingDown = false;
	private CouchDesignDocument dd;
	private File mediaDir;
	private MailNotification mailNotification;
	private Set<String> docIdsToSkip = new HashSet<String>();
	private List<FileConversionPlugin> fileConverters;
	private int workDelayInMs = WORK_DELAY_POLLING;
	
	protected UploadWorkerThread(
		UploadWorkerSettings settings
		,CouchDesignDocument dd
		,File mediaDir
		,MailNotification mailNotification
		,List<FileConversionPlugin> fileConverters
		) throws Exception {
		this.settings = settings;
		this.dd = dd;
		this.mediaDir = mediaDir;
		this.mailNotification = mailNotification;
		this.fileConverters = fileConverters;
		
		workDelayInMs = WORK_DELAY_POLLING;
		CouchDbChangeMonitor changeMonitor = dd.getDatabase().getChangeMonitor();
		if( null != changeMonitor ){
			changeMonitor.addChangeListener(this);
			workDelayInMs = WORK_DELAY_MONITOR;
		}
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
		Work work = null;
		try {
			results = dd.performQuery(query);
			work = getWork(results);
		} catch (Exception e) {
			logger.error("Error accessing server",e);
			waitMillis(60 * 1000); // wait a minute
			return;
		}
		
		if( null == work ) {
			// Nothing to do, wait
			waitMillis(workDelayInMs);
			return;
		} else {
			try {
				// Handle this work
				performWork(work);
				
			} catch(Exception e) {
				synchronized(this) {
					docIdsToSkip.add( work.getDocId() );
				}
				logger.error("Error processing document "+work.getDocId()+" ("+work.getState()+")",e);
			}
		}
	}
	
	private void performWork(Work work) throws Exception {
		
		logger.info("Upload worker thread processing: "+work.getDocId()+" ("+work.getState()+")");

		String docId = work.getDocId();
		String state = work.getState();
		
		if( UploadConstants.UPLOAD_STATUS_WAITING_FOR_UPLOAD.equals(state) ) {
			String uploadId = work.getUploadId();
			String uploadRequestDocId = work.getUploadRequestDocId();
			performWaitingForUploadWork(docId, uploadId, uploadRequestDocId);
		
		} else if( UploadConstants.UPLOAD_STATUS_SUBMITTED.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performSubmittedWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_STATUS_SUBMITTED_INLINE.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performSubmittedInlineWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_STATUS_ANALYZED.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performAnalyzedWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_STATUS_APPROVED.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performApprovedWork(docId, attachmentName);
				
		} else if( UploadConstants.UPLOAD_WORK_ORIENTATION.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performOrientationWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_THUMBNAIL.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performThumbnailWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performUploadOriginalImageWork(docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_ROTATE_CW.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performRotateWork(FileConversionPlugin.WORK_ROTATE_CW, docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_ROTATE_CCW.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performRotateWork(FileConversionPlugin.WORK_ROTATE_CCW, docId, attachmentName);
			
		} else if( UploadConstants.UPLOAD_WORK_ROTATE_180.equals(state) ) {
			String attachmentName = work.getAttachmentName();
			performRotateWork(FileConversionPlugin.WORK_ROTATE_180, docId, attachmentName);
			
		} else {
			throw new Exception("Unrecognized state: "+state);
		}

		logger.info("Upload worker thread completed: "+docId+" ("+state+")");
	}

	private void performWaitingForUploadWork(String docId, String uploadId, String uploadRequestDocId) throws Exception {
		JSONObject doc = dd.getDatabase().getDocument(docId);
		JSONObject uploadRequestDoc = dd.getDatabase().getDocument(uploadRequestDocId);
		
		JSONObject attachment = findAttachmentWithUploadId(doc, uploadId);
		String attName = attachment.getString("attachmentName");
		JSONObject nunaliitAttachments = doc.getJSONObject("nunaliit_attachments");
		JSONObject nunaliitAttachmentsFiles = nunaliitAttachments.getJSONObject("files");
		nunaliitAttachmentsFiles.remove(attName);
		
		JSONObject uploadRequest = uploadRequestDoc.getJSONObject("nunaliit_upload_request");
		JSONArray files = uploadRequest.getJSONArray("files");
		
		for(int i=0,e=files.length(); i<e; ++i){
			JSONObject file = files.getJSONObject(i);
			
			String attachmentName = file.getString("attachmentName");
			String originalName = file.getString("originalName");
			String submitter = file.getString("submitter");
			JSONObject original = file.getJSONObject("original");
			JSONObject data = file.getJSONObject("data");
			
			String effectiveAttachmentName = attachmentName;
			if( JSONSupport.containsKey(nunaliitAttachmentsFiles, effectiveAttachmentName) ) {
				// Select a different file name
				String prefix = "";
				String suffix = "";
				int pos = attachmentName.indexOf('.', 1);
				if( pos < 0 ) {
					prefix = attachmentName;
				} else {
					prefix = attachmentName.substring(0, pos-1);
					suffix = attachmentName.substring(pos);
				}
				int counter = 0;
				while( JSONSupport.containsKey(nunaliitAttachmentsFiles, effectiveAttachmentName) ) {
					attachmentName = prefix + counter + suffix;
					++counter;
				}
			}
			
			JSONObject requestAttachment = new JSONObject();
			requestAttachment.put("attachmentName", effectiveAttachmentName);
			requestAttachment.put("status", "submitted");
			requestAttachment.put("originalName", originalName);
			requestAttachment.put("submitter", submitter);
			requestAttachment.put("original", original);
			requestAttachment.put("data", data);
			requestAttachment.put("uploadId", uploadId);
			
			nunaliitAttachmentsFiles.put(effectiveAttachmentName,requestAttachment);
		}
		
		// Save document
		dd.getDatabase().updateDocument(doc);
		
		// Delete upload request
		dd.getDatabase().deleteDocument(uploadRequestDoc);
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
			CouchAuthenticationContext submitter = attDescription.getSubmitter();

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
				sendVettingNotification(docId, doc, attachmentName);
			}
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
	
	private Work getWork(CouchQueryResults results) throws Exception {
		Map<String,JSONObject> rowsByUploadId = findUploadIds(results);
				
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
				if( docIdsToSkip.contains(id) ) {
					continue;
				}
			}
			
			if( UploadConstants.UPLOAD_STATUS_WAITING_FOR_UPLOAD.equals(state) ) {
				JSONObject uploadIdRow = rowsByUploadId.get(attachmentName);
				if( null == uploadIdRow ) {
					// Missing information to continue
					continue;
				} else {
					String uploadRequestDocId = uploadIdRow.getString("id");
					
					Work work = new Work();
					work.setDocId(id);
					work.setState(state);
					work.setUploadId(attachmentName);
					work.setUploadRequestDocId(uploadRequestDocId);
					return work;
				}
				
			} else if( UploadConstants.UPLOAD_WORK_UPLOADED_FILE.equals(state) ) {
				// Ignore
				continue;
				
			} else {
				// Everything else
				Work work = new Work();
				work.setDocId(id);
				work.setState(state);
				work.setAttachmentName(attachmentName);
				return work;
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
				continue;
			}
		}
		
		return rowsByUploadId;
	}
	
	private JSONObject findAttachmentWithUploadId(JSONObject doc, String uploadId) throws Exception {
		JSONObject nunaliitAttachments = doc.optJSONObject("nunaliit_attachments");

		JSONObject files = null;
		if( null != nunaliitAttachments ){
			files = nunaliitAttachments.optJSONObject("files");
		}
		
		if( null != files ){
			Iterator<?> keyIt = files.keys();
			while( keyIt.hasNext() ){
				Object keyObj = keyIt.next();
				if( keyObj instanceof String ){
					String attName = (String)keyObj;
					JSONObject attachment = files.optJSONObject(attName);
					if( null != attachment ){
						String attachmentUploadId = attachment.optString("uploadId");
						if( null != attachmentUploadId ){
							if( attachmentUploadId.equals(uploadId) ){
								return attachment;
							}
						}
					}
				}
			}
		}
		
		return null;
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
			docIdsToSkip.remove(docId);
			this.notifyAll();
		}
	}
}
