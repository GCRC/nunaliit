package ca.carleton.gcrc.couch.date.cluster;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.couch.date.impl.TimeInterval;

public class TreeRebalanceProcess {
	
	static final int NODE_ELEMENT_THRESHOLD = 32;

	/**
	 * Results of creating or rebalancing a cluster tree.
	 *
	 */
	static public class Result {
		public List<TreeNode> legacyNodes = new Vector<TreeNode>();
		public TreeNode rootNode = null;
		public int nextClusterId;
	}

	/**
	 * Creates a new cluster tree given the provided elements. If these elements were already
	 * part of a cluster, then legacy cluster nodes are created to account for those elements.
	 * This is the perfect process in case the previous tree was lost. 
	 * @param elements Elements to be considered for the new tree.
	 * @return Results of creating a new tree.
	 * @throws Exception
	 */
	static public TreeRebalanceProcess.Result createTree(List<? extends TreeElement> elements) throws Exception {
		Result results = new Result();

		// Compute full interval, next cluster id and legacy nodes
		TimeInterval fullInterval = null;
		results.nextClusterId = 1;
		Map<Integer,TreeNode> legacyNodes = new HashMap<Integer,TreeNode>();
		for(TreeElement element : elements){
			Integer clusterId = element.getClusterId();
			
			// Accumulate full interval
			if( null == fullInterval ){
				fullInterval = element.getInterval();
			} else {
				fullInterval = fullInterval.extendTo(element.getInterval());
			}
			
			// Figure out next cluster id
			if( null != clusterId ){
				if( clusterId >= results.nextClusterId ){
					results.nextClusterId = clusterId + 1;
				}
			}
			
			// Accumulate legacy nodes
			if( null != clusterId ){
				TreeNode legacyNode = legacyNodes.get(clusterId);
				if( null == legacyNode ){
					legacyNode = new TreeNode(clusterId, element.getInterval());
					legacyNodes.put(clusterId, legacyNode);
				} else {
					legacyNode.extendTo(element.getInterval());
				}
			}
		}
		
		// Need a full interval
		if( null == fullInterval ){
			// Create a default one
			fullInterval = new TimeInterval(0, 1500000000000L);
		}
		
		// Create root node for tree
		TreeNode rootNode = new TreeNode(results.nextClusterId, fullInterval);
		results.nextClusterId++;
		
		// Install root node in results
		results.rootNode = rootNode;
		
		// Install legacy nodes in results
		results.legacyNodes.addAll( legacyNodes.values() );
		
		return results;
	}
}
