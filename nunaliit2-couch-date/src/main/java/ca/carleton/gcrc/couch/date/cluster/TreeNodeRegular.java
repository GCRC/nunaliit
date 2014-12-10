package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.cluster.TreeInsertProcess.ResultImpl;
import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

/**
 * A node in the cluster tree. A node is associated with an interval. It also
 * has an identifier (clusterId). A node can have up to two child node: the low
 * and high child nodes.
 *
 */
public class TreeNodeRegular implements TreeNode {

	private int clusterId;
	private TimeInterval interval;
	private long mid;
	private TreeNodeRegular lowChildNode = null;
	private TreeNodeRegular highChildNode = null;

	public TreeNodeRegular(int clusterId, long min, long max, long mid) throws Exception {
		this.clusterId = clusterId;
		this.interval = new TimeInterval(min, max);
		this.mid = mid;
	}

	public TreeNodeRegular(int clusterId, TimeInterval interval) throws Exception {
		this.clusterId = clusterId;
		this.interval = interval;
		if( interval.isOngoing() ) {
			throw new Exception("Must be providing a regular time interval");
		} else {
			this.mid = (long)(interval.getMin() + interval.getMax(null)) / (long)2;
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
	public TreeNodeRegular getLowChildNode(){
		return lowChildNode;
	}
	
	public void setLowChildNode(TreeNodeRegular node){
		lowChildNode = node;
	}
	
	@Override
	public TreeNodeRegular getHighChildNode(){
		return highChildNode;
	}
	
	public void setHighChildNode(TreeNodeRegular node){
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
		
		if( elemInt.getMax(now) <= this.getMidPoint() 
		 && null != this.getLowChildNode() ){
			this.getLowChildNode().insertElement(element, result, operations, now);
			
		} else if( elemInt.getMin() >= this.getMidPoint() 
		 && null != this.getHighChildNode() ){
			this.getHighChildNode().insertElement(element, result, operations, now);
		
		} else {
			// Check if low should be created
			if( null == this.getLowChildNode() 
			 && elemInt.getMax(now) <= this.getMidPoint() ){
				int count = 1;
				List<TreeElement> nodeElements = operations.getElementsForClusterId(this.getClusterId());
				for(TreeElement nodeElement : nodeElements){
					if( nodeElement.getInterval().getMax(now) <= this.getMidPoint() ){
						++count;
					}
				}
				if( count > TreeInsertProcess.NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					TreeNodeRegular childNode = new TreeNodeRegular(clusterId,elemInt);
					this.setLowChildNode(childNode);
					result.setTreeModified(true);
					
					result.insert(clusterId, element);
					return; // done
				}
			}
			
			// Check if high should be created
			if( null == this.getHighChildNode() 
			 && elemInt.getMin() >= this.getMidPoint() ){
				int count = 1;
				List<TreeElement> nodeElements = operations.getElementsForClusterId(this.getClusterId());
				for(TreeElement nodeElement : nodeElements){
					if( nodeElement.getInterval().getMin() >= this.getMidPoint() ){
						++count;
					}
				}
				if( count > TreeInsertProcess.NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					TreeNodeRegular childNode = new TreeNodeRegular(clusterId,elemInt);
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
