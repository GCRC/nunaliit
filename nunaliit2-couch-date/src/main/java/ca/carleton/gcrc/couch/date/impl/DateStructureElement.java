package ca.carleton.gcrc.couch.date.impl;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.date.cluster.TreeElement;

public class DateStructureElement implements TreeElement {

	private JSONObject dateStructure;
	private TimeInterval interval;
	private Integer clusterId;
	
	public DateStructureElement(JSONObject dateStructure) throws Exception{
		this.dateStructure = dateStructure;
		long min = dateStructure.getLong("min");
		long max = dateStructure.getLong("max");
		this.interval = new TimeInterval(min, max);
		
		int clusterId = dateStructure.optInt("index", -1);
		if( clusterId >= 0 ){
			this.clusterId = clusterId;
		}
	}
	
	@Override
	public TimeInterval getInterval() {
		return interval;
	}

	@Override
	public Integer getClusterId() {
		return clusterId;
	}

	public void setClusterId(Integer clusterId) throws Exception {
		this.clusterId = clusterId;
		dateStructure.put("index", clusterId.intValue());
	}
}
