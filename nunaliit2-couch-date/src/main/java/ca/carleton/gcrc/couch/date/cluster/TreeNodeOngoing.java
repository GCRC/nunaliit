package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.cluster.TreeInsertProcess.ResultImpl;
import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

/**
 * This is a tree node where the nodes represent a time interval based on a fixed time in the
 * past and the present.
 *
 */
public class TreeNodeOngoing implements TreeNode {

	private int clusterId;
	private TimeInterval interval;
	private long mid;
	private TreeNodeOngoing lowChildNode = null;
	private TreeNodeOngoing highChildNode = null;

	public TreeNodeOngoing(int clusterId, long min, long mid) throws Exception {
		this.clusterId = clusterId;
		this.interval = new TimeInterval(min, (NowReference)null);
		this.mid = mid;
	}

	public TreeNodeOngoing(int clusterId, TimeInterval interval) throws Exception {
		this.clusterId = clusterId;
		this.interval = interval;
		if( interval.isOngoing() ) {
			this.mid = interval.getMin();
		} else {
			throw new Exception("Must be providing an on-going time interval");
		}
	}
	
	@Override
	public int getClusterId(){
		return clusterId;
	}
	
	@Override
	public TimeInterval getInterval(){
		return interval;
	}
	
	@Override
	public long getMidPoint(){
		return mid;
	}
	
	@Override
	public TreeNodeOngoing getLowChildNode(){
		return lowChildNode;
	}
	
	public void setLowChildNode(TreeNodeOngoing node){
		lowChildNode = node;
	}
	
	@Override
	public TreeNodeOngoing getHighChildNode(){
		return highChildNode;
	}
	
	public void setHighChildNode(TreeNodeOngoing node){
		highChildNode = node;
	}
	
	@Override
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
	@Override
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

	@Override
	public void insertElement(
		TreeElement element, 
		ResultImpl result,
		TreeOperations operations, 
		NowReference now) throws Exception {

		TimeInterval elemInt = element.getInterval();
		
		if( false == elemInt.isIncludedIn(this.interval, now) ){
			// Must grow interval
			interval = interval.extendTo( elemInt );
			result.setTreeModified(true);
		}
		
		if( elemInt.getMin() <= this.getMidPoint() 
		 && null != this.getLowChildNode() ){
			this.getLowChildNode().insertElement(element, result, operations, now);
			
		} else if( elemInt.getMin() > this.getMidPoint() 
		 && null != this.getHighChildNode() ){
			this.getHighChildNode().insertElement(element, result, operations, now);
		
		} else {
			// Check if low should be created
			if( null == this.getLowChildNode() 
			 && elemInt.getMin() <= this.getMidPoint() ){
				List<TreeElement> nodeElements = operations.getElementsForClusterId(this.getClusterId());
				int count = nodeElements.size();
				if( count > TreeInsertProcess.NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					TreeNodeOngoing childNode = new TreeNodeOngoing(clusterId,elemInt);
					this.setLowChildNode(childNode);
					result.setTreeModified(true);
					
					result.insert(clusterId, element);
					return; // done
				}
			}
			
			// Check if high should be created
			if( null == this.getHighChildNode() 
			 && elemInt.getMin() > this.getMidPoint() ){
				List<TreeElement> nodeElements = operations.getElementsForClusterId(this.getClusterId());
				int count = nodeElements.size();
				if( count > TreeInsertProcess.NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					TreeNodeOngoing childNode = new TreeNodeOngoing(clusterId,elemInt);
					this.setHighChildNode(childNode);
					result.setTreeModified(true);
					
					result.insert(clusterId, element);
					return; // done
				}
			}
			
			// If we make it this far, we should insert at this level
			result.insert(this.getClusterId(), element);
		}
	}
}
