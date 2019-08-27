package ca.carleton.gcrc.couch.date.impl;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

public class DocumentsInError {

	private Map<String,Date> docIdToErrorReportDate = new HashMap<String,Date>();
	
	public void addDocumentInError(String docId, Date time){
		docIdToErrorReportDate.put(docId, time);
	}

	public void addDocumentInError(String docId){
		docIdToErrorReportDate.put(docId, new Date()); // now
	}
	
	public boolean isDocumentInError(String docId){
		Date time = docIdToErrorReportDate.get(docId);
		if( null != time ){
			return true;
		}
		return false;
	}
	
	public boolean isDocumentInErrorInLastMs(String docId, long milliseconds){
		Date time = docIdToErrorReportDate.get(docId);
		if( null != time ){
			Date now = new Date();
			Date since = new Date( now.getTime() - milliseconds );
			if( time.after(since) ){
				return true;
			}
		}
		return false;
	}
	
	public List<String> removeErrorsOlderThanMs(long milliseconds){
		List<String> errorsRemoved = new Vector<String>();
		
		Date now = new Date();
		Date since = new Date( now.getTime() - milliseconds );
		
		for(String docId : docIdToErrorReportDate.keySet()){
			Date time = docIdToErrorReportDate.get(docId);
			if( time.before(since) ){
				errorsRemoved.add(docId);
			}
		}
		
		for(String docId : errorsRemoved){
			docIdToErrorReportDate.remove(docId);
		}
		
		return errorsRemoved;
	}

	public boolean removeErrorsWithDocId(String docId){
		Date time = docIdToErrorReportDate.get(docId);
		if( null != time ){
			docIdToErrorReportDate.remove(docId);
			return true;
		}
		return false;
	}
}
