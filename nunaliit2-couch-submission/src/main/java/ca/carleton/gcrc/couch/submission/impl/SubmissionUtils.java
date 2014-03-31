package ca.carleton.gcrc.couch.submission.impl;

import java.util.Iterator;

import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

public class SubmissionUtils {

	
	/**
	 * Re-creates the original document submitted by the client from
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
}
