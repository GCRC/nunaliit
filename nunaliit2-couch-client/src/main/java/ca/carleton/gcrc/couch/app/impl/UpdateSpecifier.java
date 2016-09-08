package ca.carleton.gcrc.couch.app.impl;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentDigest;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;

public class UpdateSpecifier {

	/**
	 * Returns the actions required during a document update to modify
	 * a target document so that it become equal to a source document. 
	 * @param sourceDoc Source document
	 * @param targetDoc Document currently on the target location
	 * @return Specifier that explains what needs to happen during an update
	 * @throws Exception  
	 */
	static public UpdateSpecifier computeUpdateSpecifier(
			Document sourceDoc
			,JSONObject targetDoc
			) throws Exception {
		
		DigestComputerSha1 digestComputer = new DigestComputerSha1();
		DocumentDigest dd = digestComputer.computeDocumentDigest(sourceDoc);
		
		return computeUpdateSpecifier(
				sourceDoc
				,dd
				,targetDoc
				,DocumentUpdateProcess.Schedule.UPDATE_UNLESS_MODIFIED
				,UpdateObjectComparator.getNunaliitComparator()
				);
	}
	
	/**
	 * Returns the actions required during a document update to modify
	 * a target document so that it become equal to a source document. 
	 * @param sourceDoc Source document
	 * @param documentDigest Digest computed for source document
	 * @param targetDoc Document currently on the target location
	 * @param schedule Specifies the type of update required
	 * @return Specifier that explains what needs to happen during an update
	 * @throws Exception  
	 */
	static public UpdateSpecifier computeUpdateSpecifier(
			Document sourceDoc
			,DocumentDigest documentDigest
			,JSONObject targetDoc
			,DocumentUpdateProcess.Schedule schedule
			,Comparator<JSONObject> objectComparator
			) throws Exception {
		
		UpdateSpecifier result = new UpdateSpecifier();
		
		// Verify main document
		if( schedule == DocumentUpdateProcess.Schedule.UPDATE_FORCED ){
			result.setDocumentModified(true);
		} else if( null == targetDoc ) {
			// Document creation
			result.setDocumentModified(true);
		} else {
			if( 0 != objectComparator.compare(sourceDoc.getJSONObject(), targetDoc) ){
				result.setDocumentModified(true);
			}
		}

		// Attachments...

		// Get attachments from source document
		Map<String,Attachment> attachmentsByName = new HashMap<String,Attachment>();
		{
			Collection<Attachment> attachments = sourceDoc.getAttachments();
			if( null != attachments ) {
				for(Attachment attachment : attachments){
					attachmentsByName.put(attachment.getName(), attachment);
				}
			}
		}
		
		// Figure out which attachments should be deleted
		if( null != targetDoc ) {
			JSONObject targetAttachments = targetDoc.optJSONObject("_attachments");
			if( null != targetAttachments ){
				Iterator<?> it = targetAttachments.keys();
				while( it.hasNext() ){
					Object keyObj = it.next();
					if( keyObj instanceof String ) {
						String attachmentName = (String)keyObj;
						if( false == attachmentsByName.containsKey(attachmentName) ){
							// Target document has an attachment not available in the
							// source one. Delete.
							result.addAttachmentToDelete(attachmentName);
						}
					}
				}
			}
		}
		
		// Figure out which attachments should be uploaded
		for(Attachment attachment : attachmentsByName.values()){
			String attachmentName = attachment.getName();

			boolean shouldUpload = false;
			if( null == targetDoc ) {
				// On creation, upload all attachments
				shouldUpload = true;

			} else if( schedule == DocumentUpdateProcess.Schedule.UPDATE_FORCED ) {
				// On forced update, 
				shouldUpload = true;
			
			} else {
				String attachmentContentType = attachment.getContentType();
				shouldUpload = shouldAttachmentBeUploaded(
					targetDoc
					,attachmentName
					,documentDigest.getAttachmentDigest(attachmentName)
					,attachmentContentType
					);
			}
			
			if( shouldUpload ){
				result.addAttachmentToUpload(attachmentName);
			} else {
				result.addAttachmentNotModified(attachmentName);
			}
		}
		
		return result;
	}
	
	static private boolean shouldAttachmentBeUploaded(
			JSONObject targetDoc
			,String attachmentName
			,String attachmentDigest
			,String attachmentContentType
			) {
		
		JSONObject targetAttachments = targetDoc.optJSONObject("_attachments");
		if( null == targetAttachments ) {
			// No attachment on target doc. Upload.
			return true;
		}
		
		JSONObject targetAttachment = targetAttachments.optJSONObject(attachmentName);
		if( null == targetAttachment ) {
			// Target document does not have an attachment with this name
			return true;
		}
		
		String targetAttachmentContentType = targetAttachment.optString("content_type");
		if( null == targetAttachmentContentType ){
			// Attachment should have a content-type
			return true;
		}
		if( false == targetAttachmentContentType.equals(attachmentContentType) ){
			// content-type has changed
			return true;
		}
		
		JSONObject targetManifest = targetDoc.optJSONObject(DocumentManifest.MANIFEST_KEY);
		if( null == targetManifest ) {
			// Can not verify digest on target document
			return true;
		}

		JSONObject targetAttachmentManifests = targetManifest.optJSONObject("attachments");
		if( null == targetAttachmentManifests ) {
			// Can not verify digest on target document
			return true;
		}

		JSONObject targetAttachmentManifest = targetAttachmentManifests.optJSONObject(attachmentName);
		if( null == targetAttachmentManifest ) {
			// Can not verify digest on target document
			return true;
		}
		
		String targetAttachmentDigest = targetAttachmentManifest.optString("digest");
		if( null == targetAttachmentDigest ) {
			// Can not verify digest on target document
			return true;
		} else if( false == targetAttachmentDigest.equals(attachmentDigest) ){
			// Digest differs
			return true;
		}
		
		return false;
	}
	

	private boolean documentModified = false;
	private Set<String> attachmentsToDelete = new HashSet<String>();
	private Set<String> attachmentsToUpload = new HashSet<String>();
	private Set<String> attachmentsNotModified = new HashSet<String>();
	
	public boolean isDocumentModified() {
		return documentModified;
	}
	public void setDocumentModified(boolean documentModified) {
		this.documentModified = documentModified;
	}
	
	public Set<String> getAttachmentsToDelete() {
		return attachmentsToDelete;
	}
	public void addAttachmentToDelete(String attachmentName) {
		this.attachmentsToDelete.add(attachmentName);
	}
	
	public Set<String> getAttachmentsToUpload() {
		return attachmentsToUpload;
	}
	public void addAttachmentToUpload(String attachmentName) {
		this.attachmentsToUpload.add(attachmentName);
	}
	
	public Set<String> getAttachmentsNotModified() {
		return attachmentsNotModified;
	}
	public void addAttachmentNotModified(String attachmentName) {
		this.attachmentsNotModified.add(attachmentName);
	}
	
	public boolean isUpdateRequired(){
		if( documentModified ) {
			return true;
		} else if( attachmentsToDelete.size() > 0 ){
			return true;
		} else if( attachmentsToUpload.size() > 0 ){
			return true;
		}
		
		return false;
	}
}
