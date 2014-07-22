package ca.carleton.gcrc.couch.date.cluster;

import ca.carleton.gcrc.couch.date.impl.Interval;

public class TreeElementBase implements TreeElement {

	private Integer clusterId;
	private Interval interval;
	
	public TreeElementBase(Integer clusterId, long min, long max) throws Exception {
		this.clusterId = clusterId;
		interval = new Interval(min,max);
	}
	
	@Override
	public Interval getInterval() {
		return interval;
	}

	@Override
	public Integer getClusterId() {
		return clusterId;
	}

}
