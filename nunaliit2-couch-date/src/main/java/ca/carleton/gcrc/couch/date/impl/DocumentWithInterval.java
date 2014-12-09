package ca.carleton.gcrc.couch.date.impl;

public class DocumentWithInterval {

	private String docId;
	private TimeInterval interval;
	
	public DocumentWithInterval(String docId, TimeInterval interval){
		this.docId = docId;
		this.interval = interval;
	}

	public String getDocId() {
		return docId;
	}

	public TimeInterval getInterval() {
		return interval;
	}
	
}
