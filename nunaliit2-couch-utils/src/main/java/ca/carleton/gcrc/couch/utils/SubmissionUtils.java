package ca.carleton.gcrc.couch.utils;

import java.util.Iterator;

import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

public class SubmissionUtils {
	
	static public class DocAndReserved {
		public JSONObject doc;
		public JSONObject reserved;
	}

	/**
	 * Computes the target document identifier for this submission. Returns null
	 * if it can not be found.
	 * @param submissionDoc Submission document from the submission database
	 * @return Document identifier for the submitted document
	 */
	static public String getDocumentIdentifierFromSubmission(JSONObject submissionDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		JSONObject originalReserved = submissionInfo.optJSONObject("original_reserved");
		JSONObject submittedReserved = submissionInfo.optJSONObject("submitted_reserved");

		// Get document id and revision
		String docId = null;
		if( null != originalReserved ){
			docId = originalReserved.optString("id");
		}
		if( null == docId && null != submittedReserved){
			docId = submittedReserved.optString("id");
		}
		
		return docId;
	}
	
	/**
	 * Re-creates the document submitted by the client from
	 * the submission document.
	 * @param submissionDoc Submission document from the submission database
	 * @return Document submitted by user for update
	 */
	static public JSONObject getSubmittedDocumentFromSubmission(JSONObject submissionDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		
		JSONObject doc = submissionInfo.getJSONObject("submitted_doc");
		JSONObject reserved = submissionInfo.optJSONObject("submitted_reserved");
		
		return recreateDocumentFromDocAndReserved(doc, reserved);
	}
	
	/**
	 * Re-creates the original document when the submission was proposed from
	 * the submission document.
	 * @param submissionDoc Submission document from the submission database
	 * @return Original document when submission was provided
	 */
	static public JSONObject getOriginalDocumentFromSubmission(JSONObject submissionDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		
		JSONObject doc = submissionInfo.getJSONObject("original_doc");
		JSONObject reserved = submissionInfo.optJSONObject("original_reserved");
		
		return recreateDocumentFromDocAndReserved(doc, reserved);
	}

	/**
	 * Re-creates the approved document submitted by the client from
	 * the submission document.
	 * @param submissionDoc Submission document from the submission database
	 * @return Document submitted by user for update
	 */
	static public JSONObject getApprovedDocumentFromSubmission(JSONObject submissionDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");

		// Check if an approved version of the document is available
		JSONObject doc = submissionInfo.optJSONObject("approved_doc");
		if( null != doc ) {
			JSONObject reserved = submissionInfo.optJSONObject("approved_reserved");
			return recreateDocumentFromDocAndReserved(doc, reserved);
		} else {
			// Use submission
			doc = submissionInfo.getJSONObject("submitted_doc");
			JSONObject reserved = submissionInfo.optJSONObject("submitted_reserved");
			return recreateDocumentFromDocAndReserved(doc, reserved);
		}
	}
	
	/**
	 * Re-creates a document given the document and the reserved keys.
	 * @param doc Main document
	 * @param reserved Document that contains reserved keys. A reserve key starts with an underscore. In this document,
	 * the reserved keys do not have the starting underscore.
	 * @return
	 * @throws Exception
	 */
	static public JSONObject recreateDocumentFromDocAndReserved(JSONObject doc, JSONObject reserved) throws Exception {
		JSONObject result = JSONSupport.copyObject( doc );
		
		// Re-insert attributes that start with '_'
		if( null != reserved ) {
			Iterator<?> it = reserved.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = reserved.opt(key);
					result.put("_"+key, value);
				}
			}
		}
		
		return result;
	}
	
	/**
	 * Given a JSON document, breaks the document into two parts: the doc and reserved portions.
	 * @param doc
	 * @return
	 * @throws Exception
	 */
	static public DocAndReserved computeDocAndReservedFromDocument(JSONObject doc) throws Exception {
		DocAndReserved result = new DocAndReserved();
		
		result.doc = new JSONObject();
		result.reserved = new JSONObject();

		if( null != doc ) {
			Iterator<?> it = doc.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = doc.opt(key);
					
					if( key.startsWith("_") ){
						String effectiveKey = key.substring(1);
						result.reserved.put(effectiveKey, value);
					} else {
						result.doc.put(key, value);
					}
				}
			}
		}
		
		return result;
	}
}
