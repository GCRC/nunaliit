package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.impl.Interval;

public class TreeNode {

	private int clusterId;
	private Interval interval;
	private long mid;
	private TreeNode lowChildNode = null;
	private TreeNode highChildNode = null;

	public TreeNode(int clusterId, long min, long max, long mid) throws Exception {
		this.clusterId = clusterId;
		this.interval = new Interval(min, max);
		this.mid = mid;
	}

	public TreeNode(int clusterId, Interval interval) throws Exception {
		this.clusterId = clusterId;
		this.interval = interval;
		long mid = (long)(interval.getMin() + interval.getMax()) / (long)2;
		this.mid = mid;
	}
	
	public int getClusterId(){
		return clusterId;
	}
	
	public Interval getInterval(){
		return interval;
	}
	
	public long getMidPoint(){
		return mid;
	}
	
	public TreeNode getLowChildNode(){
		return lowChildNode;
	}
	
	public void setLowChildNode(TreeNode node){
		lowChildNode = node;
	}
	
	public TreeNode getHighChildNode(){
		return highChildNode;
	}
	
	public void setHighChildNode(TreeNode node){
		highChildNode = node;
	}
	
	public void extendTo(Interval interval) throws Exception {
		
		this.interval = this.interval.extendTo(interval);
		
		if( interval.getMin() < this.interval.getMin()
		 && null != lowChildNode ) {
			Interval lowInt = new Interval(interval.getMin(), mid);
			lowChildNode.extendTo(lowInt);
		}
		
		if( interval.getMax() > this.interval.getMax() 
		 && null != highChildNode ){
			Interval hiInt = new Interval(mid, interval.getMax());
			highChildNode.extendTo(hiInt);
		}
	}
	
	public void accumulateClusterIdsFromInterval(Interval interval, List<Integer> clusterIds){
		if( this.interval.intersectsWith(interval) ){
			clusterIds.add(this.clusterId);
			
			if( null != lowChildNode ){
				lowChildNode.accumulateClusterIdsFromInterval(interval, clusterIds);
			}
			if( null != highChildNode ){
				highChildNode.accumulateClusterIdsFromInterval(interval, clusterIds);
			}
		}
	}
}
