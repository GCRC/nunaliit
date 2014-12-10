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
	
	void accumulateClusterIdsFromInterval(
		TimeInterval interval, 
		List<Integer> clusterIds, 
		NowReference now) throws Exception;
	
	void insertElement(
		TreeElement element, 
		ResultImpl result, 
		TreeOperations operations,
		NowReference now) throws Exception;
}
