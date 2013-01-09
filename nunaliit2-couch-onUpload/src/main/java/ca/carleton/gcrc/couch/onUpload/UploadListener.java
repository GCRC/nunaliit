package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.couch.client.impl.CouchContextCookie;
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.UserDataDescriptor;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.upload.LoadedFile;
import ca.carleton.gcrc.upload.OnUploadedListener;

public class UploadListener implements OnUploadedListener {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private CouchDesignDocument dd;
	private File mediaDir;
	
	public UploadListener(
		CouchDesignDocument dd
		,File mediaDir
		) {
		this.dd = dd;
		this.mediaDir = mediaDir;
	}

	@Override
	public JSONObject onLoad(
		String progressId
		,List<LoadedFile> uploadedFiles
		,Map<String, List<String>> parameters
		,Principal userPrincipal
		,Cookie[] cookies
		) throws Exception {
		
		// Check if this is uploading to an existing document
		// or uploading to a new document
		String docId = null;
		String revision = null;
		if( parameters.containsKey("id") ) {
			if( parameters.get("id").size() > 0 ) {
				docId = parameters.get("id").get(0);
			}
		}
		if( parameters.containsKey("rev") ) {
			if( parameters.get("rev").size() > 0 ) {
				revision = parameters.get("rev").get(0);
			}
		}
		
		// Get CouchDb instance on behalf of the user
		CouchDb userCouchDb = getUserCouchDbFromCookies(cookies);
		CouchUserContext userContext = getUserFromClient(userCouchDb.getClient());
		
		if( null != docId 
		 && null != revision 
		 && uploadedFiles.size() > 0 ) {
			// This is uploading to an existing document
			JSONObject doc = null;
			try {
				doc = userCouchDb.getDocument(docId);
				
				logger.info("onLoad fetched: "+doc.optString("_id")+" -> "+doc.optString("_rev") 
						+ " for: " + userContext.getName() );
			} catch(Exception e) {
				logger.error("Unable to load document for id: "+docId,e);
			}

			if( null != doc ) {
				for(LoadedFile uploadedFile : uploadedFiles) {
					File actualFile = uploadedFile.getFile();
					String originalName = uploadedFile.getOriginalFileName();
					
					JSONObject nunaliitAttachments = doc.optJSONObject(UploadConstants.ATTACHMENTS_KEY);
					if( null == nunaliitAttachments ) {
						nunaliitAttachments = new JSONObject();
						nunaliitAttachments.put("nunaliit_type", "attachment_descriptions");
						nunaliitAttachments.put("files", new JSONObject());
						doc.put(UploadConstants.ATTACHMENTS_KEY, nunaliitAttachments);
					}
					JSONObject fileDic = nunaliitAttachments.optJSONObject("files");
					if( null == fileDic ) {
						fileDic = new JSONObject();
						nunaliitAttachments.put("files",fileDic);
					}

					// Compute name for attachment
					String attachmentName = null;
					{
						File tempFile = new File(originalName);
						attachmentName = tempFile.getName();
						if( JSONSupport.containsKey(fileDic, attachmentName) ) {
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
							while( JSONSupport.containsKey(fileDic, attachmentName) ) {
								attachmentName = prefix + counter + suffix;
								++counter;
							}
						}
					}

					FileConversionContext conversionContext = new FileConversionContext(doc, dd, attachmentName, mediaDir);
					
					AttachmentDescriptor fileDescription = conversionContext.getAttachmentDescription();
					
					fileDescription.setAttachmentName(attachmentName);
					fileDescription.setStatus(UploadConstants.UPLOAD_STATUS_SUBMITTED);
					fileDescription.setOriginalName(originalName);
					fileDescription.setSubmitterName(userContext.getName());
					
					OriginalFileDescriptor originalJson = fileDescription.getOriginalFileDescription();
					originalJson.setMediaFileName(actualFile.getName());

					// Add user data
					UserDataDescriptor userData = fileDescription.getUserDataDescription();
					for(String key : parameters.keySet()) {
						if( "id".equals(key)
						 || "rev".equals(key)
						 ) {
							// Drop already processed parameters
						} else {
							List<String> values = parameters.get(key);
							if( values.size() > 0 ) {
								userData.setStringAttribute(key, values.get(0));
							}
						}
					}
					
					// Update document before saving
					CouchNunaliitUtils.adjustDocumentForStorage(doc, userContext);
					
					try {
						userCouchDb.updateDocument(doc);
						
						logger.info("onLoad update: "+doc.optString("_id")+" -> "+actualFile);
					} catch(Exception e) {
						logger.error("Unable to save information about file: "+actualFile.getName(),e);
					}
				}
			}
		}
		
		return null;
	}

	private CouchDb getUserCouchDbFromCookies(Cookie[] cookies) throws Exception {
		CouchContextCookie contextCookie = new CouchContextCookie();
		for(Cookie cookie : cookies){
			contextCookie.setCookie(cookie.getName(), cookie.getValue());
		}
		
		CouchFactory factory = new CouchFactory();
		return factory.getDb(contextCookie, dd.getDatabase());
	}

	private CouchUserContext getUserFromClient(CouchClient client) throws Exception {
		CouchSession session = client.getSession();
		return session.getCurrentUserContext();
	}
}
