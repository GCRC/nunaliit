package ca.carleton.gcrc.couch.date.cluster;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

public class TreeRebalanceProcess {
	
	static final int NODE_ELEMENT_THRESHOLD = 32;

	/**
	 * Results of creating or rebalancing a cluster tree.
	 *
	 */
	static public class Result {
		public TreeNodeRegular regularRootNode = null;
		public TreeNodeOngoing ongoingRootNode = null;
		public List<TreeNode> legacyNodes = new Vector<TreeNode>();
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
		TimeInterval fullRegularInterval = null;
		TimeInterval fullOngoingInterval = null;
		results.nextClusterId = 1;
		Map<Integer,TreeNodeRegular> legacyRegularNodes = new HashMap<Integer,TreeNodeRegular>();
		Map<Integer,TreeNodeOngoing> legacyOngoingNodes = new HashMap<Integer,TreeNodeOngoing>();
		for(TreeElement element : elements){
			Integer clusterId = element.getClusterId();
			
			// Accumulate full intervals
			if( element.getInterval().isOngoing() ){
				if( null == fullOngoingInterval ){
					fullOngoingInterval = element.getInterval();
				} else {
					fullOngoingInterval = fullOngoingInterval.extendTo(element.getInterval());
				}
			} else {
				if( null == fullRegularInterval ){
					fullRegularInterval = element.getInterval();
				} else {
					fullRegularInterval = fullRegularInterval.extendTo(element.getInterval());
				}
			}
			
			// Figure out next cluster id
			if( null != clusterId ){
				if( clusterId >= results.nextClusterId ){
					results.nextClusterId = clusterId + 1;
				}
			}
			
			// Accumulate legacy nodes
			if( null != clusterId ){
				TimeInterval elementInterval = element.getInterval();
				if( elementInterval.isOngoing() ){
					TreeNodeOngoing legacyNode = legacyOngoingNodes.get(clusterId);
					if( null == legacyNode ){
						legacyNode = new TreeNodeOngoing(clusterId, element.getInterval());
						legacyOngoingNodes.put(clusterId, legacyNode);
					} else {
						legacyNode.extendTo(element.getInterval());
					}
				} else {
					TreeNodeRegular legacyNode = legacyRegularNodes.get(clusterId);
					if( null == legacyNode ){
						legacyNode = new TreeNodeRegular(clusterId, element.getInterval());
						legacyRegularNodes.put(clusterId, legacyNode);
					} else {
						legacyNode.extendTo(element.getInterval());
					}
				}
			}
		}
		
		// Need a full interval
		if( null == fullRegularInterval ){
			// Create a default one
			fullRegularInterval = new TimeInterval(0, 1500000000000L);
		}
		if( null == fullOngoingInterval ){
			// Create a default one
			fullOngoingInterval = new TimeInterval(0, (NowReference)null);
		}
		
		// Create root node for tree
		TreeNodeRegular regularRootNode = new TreeNodeRegular(results.nextClusterId, fullRegularInterval);
		results.nextClusterId++;
		TreeNodeOngoing ongoingRootNode = new TreeNodeOngoing(results.nextClusterId, fullOngoingInterval);
		results.nextClusterId++;
		
		// Install root node in results
		results.regularRootNode = regularRootNode;
		results.ongoingRootNode = ongoingRootNode;
		
		// Install legacy nodes in results
		results.legacyNodes.addAll( legacyRegularNodes.values() );
		results.legacyNodes.addAll( legacyOngoingNodes.values() );
		return results;
	}
}
