package ca.carleton.gcrc.couch.onUpload;

import java.io.File;
import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.Cookie;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.impl.CouchContextCookie;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.upload.LoadedFile;
import ca.carleton.gcrc.upload.OnUploadedListener;

public class UploadListener implements OnUploadedListener {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private CouchDesignDocument dd;
//	private File mediaDir;
	
	public UploadListener(
		CouchDesignDocument dd
		,File mediaDir
		) {
		this.dd = dd;
//		this.mediaDir = mediaDir;
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
		String uploadId = null;
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
		if( parameters.containsKey("uploadId") ) {
			if( parameters.get("uploadId").size() > 0 ) {
				uploadId = parameters.get("uploadId").get(0);
			}
		}
		
		if( null == uploadId ){
			logger.error("Unable to process upload request since parameter 'uploadId' is not provided "+docId+"/"+revision);
			return null;
		}
		
		/*
		 	Creates an upload request:
		 	
		 	{
		 		nunaliit_upload_request:{
		 			docId: <doc-id>
		 			,revision: <revision>
		 			,uploadId: <uploadId>
		 			,files: [
		 				{
		 					attachmentName: <attachment-name>
		 					,originalName: <original-name>
		 					,submitter: <user-identifier>
		 					,original: {
		 						mediaFile: <media-file>
		 					}
		 					,data: {
		 						<key>: <value>
		 					}
		 				}
		 			]
		 		}
		 	}
		 	
		 	where:
		 		<doc-id> is expected document identifier where upload request should
		 		         be applied (informational)
		 		<revision> is the version of the document where upload request was
		 		           generated (informational)
		 		<uploadId> is the unique identifier linking the upload request with the
		 		           document where the upload should be applied
		 		<attachment-name> is a name derived from the uploaded file name to represent this
		 		                  attachment
		 		<original-name> is the original file name
		 		<user-identifier> is the name of the use who submitted the upload request
		 		<media-file> the actual file name stored on disk (in media directory)
		 		<key> a key provided by the submitter
		 		<value> a value provided by the submitter
		 */
		
		try {
			// Get CouchDb instance on behalf of the user
			CouchDb userCouchDb = getUserCouchDbFromCookies(cookies);
			CouchAuthenticationContext userContext = getUserFromClient(userCouchDb.getClient());
			
			// Create an upload request
			JSONObject doc = new JSONObject();
			
			JSONObject uploadRequest = new JSONObject();
			doc.put("nunaliit_upload_request", uploadRequest);
			uploadRequest.put("docId", docId);
			uploadRequest.put("revision", revision);
			uploadRequest.put("uploadId", uploadId);

			JSONArray files = new JSONArray();
			uploadRequest.put("files", files);
			
			Set<String> fileNames = new HashSet<String>();
			for(LoadedFile uploadedFile : uploadedFiles) {
				File actualFile = uploadedFile.getFile();
				String originalName = uploadedFile.getOriginalFileName();
				
				// Compute name for attachment
				String attachmentName = null;
				{
					File tempFile = new File(originalName);
					attachmentName = tempFile.getName();
					if( fileNames.contains(attachmentName) ) {
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
						while( fileNames.contains(attachmentName) ) {
							attachmentName = prefix + counter + suffix;
							++counter;
						}
					}
				}
				fileNames.add(attachmentName);
				
				JSONObject file = new JSONObject();
				files.put(file);
				file.put("attachmentName", attachmentName);
				file.put("originalName", originalName);
				file.put("submitter", userContext.getName());
				
				JSONObject original = new JSONObject();
				file.put("original", original);
				original.put("mediaFile", actualFile.getName());
				
				// Add user data
				JSONObject data = new JSONObject();
				file.put("data", data);
				for(String key : parameters.keySet()) {
					if( "id".equals(key)
					 || "rev".equals(key)
					 || "uploadId".equals(key)
					 ) {
						// Drop already processed parameters
					} else {
						List<String> values = parameters.get(key);
						if( values.size() > 0 ) {
							data.put(key, values.get(0));
						}
					}
				}
			}
			
			// Update document before saving
			CouchNunaliitUtils.adjustDocumentForStorage(doc, userContext);
		
			userCouchDb.createDocument(doc);
			
			logger.info("onLoad update: "+doc.optString("_id")+" -> "+fileNames);
		} catch(Exception e) {
			logger.error("Unable to create an upload request",e);
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

	private CouchAuthenticationContext getUserFromClient(CouchClient client) throws Exception {
		CouchSession session = client.getSession();
		return session.getAuthenticationContext();
	}
}
