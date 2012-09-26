package ca.carleton.gcrc.couch.app.impl;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.json.JSONObject;
import ca.carleton.gcrc.couch.app.DigestComputer;
import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentDigest;
import ca.carleton.gcrc.json.JSONSupport;

public class DocumentManifest {

	final static public String MANIFEST_KEY = "nunaliit_manifest";

	static private DigestComputerSha1 sha1DigestComputer = new DigestComputerSha1();
	
	/**
	 * Analyzes a document and determines if the document has been modified
	 * since the time the manifest was computed.
	 * @param targetDoc Remote JSON document to test for modification
	 * @param digestComputer Digest computer used to verify the compute intermediate
	 * digest and verify authenticity of given manifest.
	 * @return True, if remote document appears to have been modified since
	 * the manifest was computed.
	 */
	static public boolean hasDocumentBeenModified(
			JSONObject targetDoc
			) {

		JSONObject targetManifest = targetDoc.optJSONObject(MANIFEST_KEY);
		if( null == targetManifest ) {
			// Can not verify digest on target document. Let's assume it has
			// been modified
			return true;
		}

		String targetDigest = targetManifest.optString("digest");
		if( null == targetDigest ) {
			// Can not verify digest on target document, let's assume it
			// has changed
			return true;
		}
		
		// Check type
		DigestComputer digestComputer = null;
		{
			String type = targetManifest.optString("type");
			if( null == type ){
				// Has been modified sine type is missing
				return true;
				
			} else if( DigestComputerSha1.DIGEST_COMPUTER_TYPE.equals(type) ) {
				digestComputer = sha1DigestComputer;
				
			} else {
				// Unrecognized type. Assume it was changed
				return true;
			}
		}
		
		try {
			String computedDigest = digestComputer.computeDigestFromJsonObject(targetDoc);
			if( false == computedDigest.equals(targetDigest) ) {
				// Digests are different. It was changed
				return true;
			}
		} catch(Exception e) {
			// Error computing digest, let's assume it was changed
			return true;
		}
		
		// Verify attachments by checking each attachment in manifest and verifying
		// each attachment has not changed
		Set<String> attachmentNamesInManifest = new HashSet<String>();
		JSONObject targetAttachmentManifests = targetManifest.optJSONObject("attachments");
		if( null != targetAttachmentManifests ){
			Iterator<?> it = targetAttachmentManifests.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String attachmentName = (String)keyObj;
					attachmentNamesInManifest.add(attachmentName);
					
					JSONObject attachmentManifest = targetAttachmentManifests.optJSONObject(attachmentName);
					if( null == attachmentManifest ) {
						// Error. Must have been changed
						return true;
					} else if( false == JSONSupport.containsKey(attachmentManifest,"revpos") ) {
						// revpos is gone, document must have been modified
						return true;
					} else {
						int revpos = attachmentManifest.optInt("revpos",0);
						Integer actualRevPos = getAttachmentPosition(targetDoc,attachmentName);
						if( null == actualRevPos ) {
							// Attachment is gone
							return true;
						} else if( revpos != actualRevPos.intValue() ){
							// Attachment has changed
							return true;
						}
					}
				}
			}
		}
		
		// Verify that each attachment has a manifest declared for it
		JSONObject targetAttachments = targetDoc.optJSONObject("_attachments");
		if( null != targetAttachments ) {
			Iterator<?> it = targetAttachments.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String attachmentName = (String)keyObj;

					if( false == attachmentNamesInManifest.contains(attachmentName) ){
						// This attachment was added since manifest was computed
						return true;
					}
				}
			}
		}

		// If we make it here, the document has not changed according to the manifest
		return false;
	}
	
	/**
	 * Given a JSON document and an attachment name, returns the
	 * revision position associated with the attachment.
	 * @param targetDoc
	 * @param attachmentName
	 * @return
	 */
	static public Integer getAttachmentPosition(
			JSONObject targetDoc
			,String attachmentName
			) {
		
		JSONObject targetAttachments = targetDoc.optJSONObject("_attachments");
		if( null == targetAttachments ) {
			// No attachment on target doc
			return null;
		}
		
		JSONObject targetAttachment = targetAttachments.optJSONObject(attachmentName);
		if( null == targetAttachment ) {
			// Target document does not have an attachment with this name
			return null;
		}
		
		if( JSONSupport.containsKey(targetAttachment,"revpos") ){
			int revPos = targetAttachment.optInt("revpos",-1);
			if( revPos < 0 ){
				return null;
			}
			return revPos;
		}
		
		return null;
	}
	
	/**
	 * Computes a manifest to be associated with a document stored in
	 * a database. This manifest represents the state of the document
	 * and can be verified. The aim of the manifest is to:
	 * 1. Verify if another document is equivalent to another one, when
	 *    a document digest has been computed on the latter.
	 * 2. Verify that an document has not been modified in the database
	 *    since a manifest was computed for it.
	 * @param sourceDoc Document that is to be uploaded to a database
	 * @param documentDigest Digest computed for the sourceDoc
	 * @param previousDocument Document currently stored in the database. Specify this
	 * parameter only when performing a document update, not during creation.
	 * @param updateSpecifier Report that specifies the update actions that
	 * will be taken during the document upload. Specify this parameter only when
	 * performing a document update, not during creation.
	 * @return The manifest that should be installed in the document
	 * @throws Exception Invalid parameters. Invalid object state.
	 */
	static public JSONObject computeManifest(
			Document sourceDoc
			,DocumentDigest documentDigest
			,JSONObject previousDocument
			,UpdateSpecifier updateSpecifier
			) throws Exception {
		
		// Verify parameters
		if( null == sourceDoc ) {
			throw new Exception("Parameter 'sourceDoc' must be provided to compute a manifest");
		}
		if( null == documentDigest ) {
			throw new Exception("Parameter 'documentDigest' must be provided to compute a manifest");
		}
		if( null == updateSpecifier ) {
			throw new Exception("Parameter 'updateSpecifier' must be provided to compute a manifest");
		}

		// Compute the revision that will be associated with the
		// next object update
		int nextRevision = 1; // creation
		if( null != previousDocument ) {
			String revString = previousDocument.getString("_rev");
			if( null == revString ) {
				throw new Exception("Previous document offered to compute a manifest does not contain a '_rev' attribute.");
			}
			int dashIndex = revString.indexOf('-');
			if( dashIndex < 1 ) {
				throw new Exception("Does not understand rev attribute while computing a manifest: "+revString);
			}
			revString = revString.substring(0, dashIndex);
			nextRevision = Integer.parseInt(revString);
			if( nextRevision < 1 ){
				throw new Exception("Invalid revision found while computing a manifest: "+revString);
			}
			++nextRevision;
		}
		
		// Quick access
		Set<String> attachmentsToUpload = null;
		Set<String> attachmentsNotModified = null;
		if( null != updateSpecifier ) {
			attachmentsToUpload = updateSpecifier.getAttachmentsToUpload();
			attachmentsNotModified = updateSpecifier.getAttachmentsNotModified();
		}
		
		JSONObject manifest = new JSONObject();
		
		manifest.put("type", documentDigest.getType());
		manifest.put("digest", documentDigest.getDocDigest());
		
		JSONObject attachments = new JSONObject();
		for(String attachmentName : documentDigest.getAttachmentNames()){
			String attachmentDigest = documentDigest.getAttachmentDigest(attachmentName);
			
			// Figure out revision position for this attachment
			int attachmentPosition = 1; // creation
			if( null != previousDocument ) {
				// Update case. Either, the attachment will be uploaded, or not.
				// If uploaded, take the next revision.
				// If not modified, keep the revision that was previously reported.
				
				if( attachmentsToUpload.contains(attachmentName) ){
					// This attachment will be uploaded. Therefore, guess the revision
					// position that will be associated with this attachment
					attachmentPosition = nextRevision;
					
				} else if( attachmentsNotModified.contains(attachmentName) ){
					// This attachment already exists on the target document and will
					// not be updated. Keep the revision that was previously reported
					attachmentPosition = DocumentManifest.getAttachmentPosition(previousDocument, attachmentName);
					
				} else {
					throw new Exception("Error while computing manifest revision for attachment: "+attachmentName);
				}
			}
			
			JSONObject att = new JSONObject();
			att.put("digest", attachmentDigest);
			att.put("revpos", attachmentPosition);
			
			attachments.put(attachmentName, att);
		}
		manifest.put("attachments", attachments);
		
		return manifest;
	}
}
