package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

/**
 * A node in the cluster tree. A node is associated with an interval. It also
 * has an identifier (clusterId). A node can have up to two child node: the low
 * and high child nodes.
 *
 */
public class TreeNode {

	private int clusterId;
	private TimeInterval interval;
	private long mid;
	private TreeNode lowChildNode = null;
	private TreeNode highChildNode = null;

	public TreeNode(int clusterId, long min, long max, long mid) throws Exception {
		this.clusterId = clusterId;
		this.interval = new TimeInterval(min, max);
		this.mid = mid;
	}

	public TreeNode(int clusterId, TimeInterval interval) throws Exception {
		this.clusterId = clusterId;
		this.interval = interval;
		if( interval.endsNow() ) {
			this.mid = (long)(interval.getMin() + interval.getMax(NowReference.now())) / (long)2;
		} else {
			this.mid = (long)(interval.getMin() + interval.getMax(null)) / (long)2;
		}
	}
	
	public int getClusterId(){
		return clusterId;
	}
	
	public TimeInterval getInterval(){
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
	
	public void extendTo(TimeInterval interval) throws Exception {
		
		this.interval = this.interval.extendTo(interval);
		
	}
	
	/**
	 * Find all nodes that intersect with the given interval and accumulate the
	 * node identifiers (cluster ids) in a provided list.
	 * @param interval Interval that is requested
	 * @param clusterIds List of cluster ids that match the given interval
	 * @throws Exception 
	 */
	public void accumulateClusterIdsFromInterval(
			TimeInterval interval, 
			List<Integer> clusterIds, 
			NowReference now) throws Exception {
		
		if( this.interval.intersectsWith(interval, now) ){
			clusterIds.add(this.clusterId);
			
			if( null != lowChildNode ){
				lowChildNode.accumulateClusterIdsFromInterval(interval, clusterIds, now);
			}
			if( null != highChildNode ){
				highChildNode.accumulateClusterIdsFromInterval(interval, clusterIds, now);
			}
		}
	}
}
