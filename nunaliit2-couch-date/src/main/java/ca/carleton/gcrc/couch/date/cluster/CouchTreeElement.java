package ca.carleton.gcrc.couch.date.cluster;

import ca.carleton.gcrc.couch.date.impl.TimeInterval;

public class CouchTreeElement implements TreeElement {

	private Integer clusterId;
	private TimeInterval interval;
	private String docId;
	
	public CouchTreeElement(String docId, Integer clusterId, TimeInterval interval) throws Exception {
		this.docId = docId;
		this.clusterId = clusterId;
		this.interval = interval;
	}
	
	@Override
	public Integer getClusterId() {
		return clusterId;
	}
	
	@Override
	public TimeInterval getInterval() {
		return interval;
	}
	
	public String getDocId(){
		return docId;
	}
}
