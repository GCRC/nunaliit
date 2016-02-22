package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.cluster.TreeInsertProcess.ResultImpl;
import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

public interface TreeNode {

	int getClusterId();
	
	TimeInterval getInterval();

	long getMidPoint();
	
	TreeNode getLowChildNode();
	
	TreeNode getHighChildNode();
	
	void extendTo(TimeInterval interval) throws Exception;
	
	/**
	 * Find all instances of TreeNode that intersects with given time
	 * interval, and save their associated cluster identifiers to the
	 * list given in reference. This method recursively searches the
	 * children nodes.
	 * @param interval Interval for which TreeNode are seeked
	 * @param clusterIds The list that accumulates the cluster identifiers which
	 * match the interval
	 * @param now Provides the current time
	 * @throws Exception
	 */
	void accumulateClusterIdsFromInterval(
		TimeInterval interval, 
		List<Integer> clusterIds, 
		NowReference now) throws Exception;
	
	/**
	 * Find the node where the element should fit. If none is found,
	 * create a new node. Assign to the result variable the outcome of 
	 * the insertion.
	 * @param element Element to be added to the node.
	 * @param result Results associated with insertion
	 * @param operations Tree operations 
	 * @param now Reference to current time
	 * @throws Exception
	 */
	void insertElement(
		TreeElement element, 
		ResultImpl result, 
		TreeOperations operations,
		NowReference now) throws Exception;
}
