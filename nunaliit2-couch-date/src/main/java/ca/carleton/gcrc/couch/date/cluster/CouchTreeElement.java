package ca.carleton.gcrc.couch.date.cluster;

import ca.carleton.gcrc.couch.date.impl.TimeInterval;

public class CouchTreeElement implements TreeElement {

	private Integer clusterId;
	private TimeInterval interval;
	private String docId;
	
	public CouchTreeElement(String docId, Integer clusterId, long min, long max) throws Exception {
		this.clusterId = clusterId;
		this.interval = new TimeInterval(min, max);
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
