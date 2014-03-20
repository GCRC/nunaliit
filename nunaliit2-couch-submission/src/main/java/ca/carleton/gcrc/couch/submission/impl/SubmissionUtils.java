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
	static public JSONObject getOriginalSubmission(JSONObject submissionDoc) throws Exception {
		JSONObject submissionInfo = submissionDoc.getJSONObject("nunaliit_submission");
		
		JSONObject originalDoc = JSONSupport.copyObject( submissionInfo.getJSONObject("doc") );
		
		// Re-insert attributes that start with '_'
		JSONObject info = submissionInfo.optJSONObject("reserved");
		if( null != info ) {
			Iterator<?> it = info.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = info.opt(key);
					originalDoc.put("_"+key, value);
				}
			}
		}
		
		return originalDoc;
	}
}
