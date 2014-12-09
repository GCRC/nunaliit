package ca.carleton.gcrc.couch.date.cluster;

import ca.carleton.gcrc.couch.date.impl.TimeInterval;

public class TreeElementBase implements TreeElement {

	private Integer clusterId;
	private TimeInterval interval;
	
	public TreeElementBase(Integer clusterId, long min, long max) throws Exception {
		this.clusterId = clusterId;
		interval = new TimeInterval(min,max);
	}
	
	@Override
	public TimeInterval getInterval() {
		return interval;
	}

	@Override
	public Integer getClusterId() {
		return clusterId;
	}

}
