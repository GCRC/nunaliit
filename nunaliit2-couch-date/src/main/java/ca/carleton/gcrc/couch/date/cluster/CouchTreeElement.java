package ca.carleton.gcrc.couch.date.cluster;

import ca.carleton.gcrc.couch.date.impl.Interval;

public class CouchTreeElement implements TreeElement {

	private Integer clusterId;
	private Interval interval;
	private String docId;
	
	public CouchTreeElement(String docId, Integer clusterId, long min, long max) throws Exception {
		this.clusterId = clusterId;
		this.interval = new Interval(min, max);
	}
	
	@Override
	public Integer getClusterId() {
		return clusterId;
	}
	
	@Override
	public Interval getInterval() {
		return interval;
	}
	
	public String getDocId(){
		return docId;
	}
}
