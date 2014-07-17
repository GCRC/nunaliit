package ca.carleton.gcrc.couch.date.impl;

public class DocumentWithInterval {

	private String docId;
	private Interval interval;
	
	public DocumentWithInterval(String docId, Interval interval){
		this.docId = docId;
		this.interval = interval;
	}

	public String getDocId() {
		return docId;
	}

	public Interval getInterval() {
		return interval;
	}
	
}
