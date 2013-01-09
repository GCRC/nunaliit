package ca.carleton.gcrc.couch.app;

import java.net.URL;
import java.net.URLEncoder;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.DocumentUpdateListener.Phase;
import ca.carleton.gcrc.couch.app.impl.DigestComputerSha1;
import ca.carleton.gcrc.couch.app.impl.DocumentUpdateListenerDefault;
import ca.carleton.gcrc.couch.app.impl.DocumentManifest;
import ca.carleton.gcrc.couch.app.impl.StreamProducerDocumentUpdate;
import ca.carleton.gcrc.couch.app.impl.UpdateSpecifier;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.impl.ConnectionUtils;

public class DocumentUpdateProcess {
	
	static private DocumentUpdateListener defaultListener = new DocumentUpdateListenerDefault();

	public enum Schedule {
		/**
		 * Update target document on database if the document on
		 * the database is different than the one presented. This
		 * update is cancelled if the target document  is
		 * deemed modified since the last time it was updated.
		 * A document is suspected to have been modified if it 
		 * manifest is not found or does not match the current 
		 * document state. 
		 */
		UPDATE_UNLESS_MODIFIED,
		/**
		 * Update target document on database if the document on
		 * the database is different than the one presented. This
		 * update should be performed even if the document on the
		 * database has been modified since the last update.
		 * A document is suspected to have been modified if it 
		 * manifest is not found or does not match the current 
		 * document state. 
		 */
		UPDATE_EVEN_IF_MODIFIED,
		/**
		 * Update target document on database regardless if the
		 * presented document is equivalent and regardless if the 
		 * document on the database has been modified since the 
		 * last update. This update is forced. 
		 */
		UPDATE_FORCED
	};
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb couchDb;
	private DigestComputerSha1 digestComputer = new DigestComputerSha1();
	private DocumentUpdateListener listener = defaultListener;
	
	public DocumentUpdateProcess(
		CouchDb couchDb
		) throws Exception {
		this.couchDb = couchDb;
	}

	public CouchDb getCouchDb() {
		return couchDb;
	}
	
	public DocumentUpdateListener getListener() {
		return listener;
	}

	public void setListener(DocumentUpdateListener listener) {
		this.listener = listener;
	}

	public void update(Document sourceDoc) throws Exception {
		update(sourceDoc, Schedule.UPDATE_UNLESS_MODIFIED);
	}

	public void update(Document sourceDoc, boolean forced) throws Exception {
		if( forced ) {
			update(sourceDoc, Schedule.UPDATE_FORCED);
		} else {
			update(sourceDoc, Schedule.UPDATE_UNLESS_MODIFIED);
		}
	}

	public void update(Document sourceDoc, Schedule schedule) throws Exception {
		if( null == sourceDoc ){
			throw new Exception("Document must be supplied when updating");
		}
		
		String docId = sourceDoc.getId();
		if( null == docId ){
			throw new Exception("On document update, an _id is required");
		}
		
		// Compute digest info
		DocumentDigest dd = null;
		try {
			dd = digestComputer.computeDocumentDigest(sourceDoc);

		} catch(Exception e) {
			throw new Exception("Unable to compute signature on document", e);
		}
		
		// Check if doc exists in database
		JSONObject currentTargetDoc = null;
		boolean creationRequired = false;
		boolean modified = false;
		UpdateSpecifier updateSpecifier = null;
		try {
			if( false == couchDb.documentExists(docId) ) {
				creationRequired = true;
				updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(sourceDoc, dd, null, schedule);
				
			} else {
				// Get document from database
				currentTargetDoc = couchDb.getDocument(docId);
				
				// Check if the document in database was modified
				modified = DocumentManifest.hasDocumentBeenModified(currentTargetDoc);
				
				// Figure out the differences between the source document and
				// the target document
				updateSpecifier = UpdateSpecifier.computeUpdateSpecifier(sourceDoc, dd, currentTargetDoc, schedule);
			}
		} catch(Exception e) {
			throw new Exception("Unable to access current document", e);
		}
		
		// Upload, if required
		if( creationRequired ) {
			listener.updatingDocument(Phase.BEFORE, sourceDoc);
			updateDocument(sourceDoc, dd, null, updateSpecifier);
			listener.updatingDocument(Phase.AFTER, sourceDoc);

		} else if( schedule == Schedule.UPDATE_FORCED ) {
			// Forced update always take place
			listener.updatingDocument(Phase.BEFORE, sourceDoc);
			updateDocument(sourceDoc, dd, currentTargetDoc, updateSpecifier);
			listener.updatingDocument(Phase.AFTER, sourceDoc);

		} else if( false == updateSpecifier.isUpdateRequired() ) {
			// Document on database is same as the one requested. No
			// update required
			listener.documentSkippedBecauseUnchanged(sourceDoc);
			
		} else if( modified && schedule == Schedule.UPDATE_UNLESS_MODIFIED ) {
			// Can not change modified database document under this schedule
			listener.documentSkippedBecauseModified(sourceDoc);
			
		} else {
			// At this point, this is a regular update
			listener.updatingDocument(Phase.BEFORE, sourceDoc);
			updateDocument(sourceDoc, dd, currentTargetDoc, updateSpecifier);
			listener.updatingDocument(Phase.AFTER, sourceDoc);
		}
	}

	private void updateDocument(
		Document sourceDoc
		,DocumentDigest documentDigest
		,JSONObject currentTargetDoc
		,UpdateSpecifier updateSpecifier
		) throws Exception {
		
		String docId = sourceDoc.getId();
		if( null == docId ){
			throw new Exception("On document update, an _id is required");
		}
		
		StreamProducerDocumentUpdate producer = new StreamProducerDocumentUpdate(
				sourceDoc
				,documentDigest
				,currentTargetDoc
				,updateSpecifier
				);

		// Compute URL
		URL effectiveUrl = new URL(couchDb.getUrl(), URLEncoder.encode(docId,"UTF-8"));
		
		// Update
		JSONObject response = ConnectionUtils.putStreamResource(
				couchDb.getContext()
				,effectiveUrl
				,producer
				,"application/json; charset=utf-8"
				);
		
		ConnectionUtils.captureReponseErrors(response, "Error while updating "+docId+": ");
		
	}
}
