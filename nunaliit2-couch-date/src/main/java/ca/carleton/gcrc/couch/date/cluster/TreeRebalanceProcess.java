package ca.carleton.gcrc.couch.date.cluster;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.couch.date.impl.Interval;

public class TreeRebalanceProcess {
	
	static final int NODE_ELEMENT_THRESHOLD = 32;

	static public class Result {
		public List<TreeNode> legacyNodes = new Vector<TreeNode>();
		public TreeNode rootNode = null;
		public int nextClusterId;
	}
	
	static private class TreeNodeWithElements {
		private TreeNode node;
		private List<TreeElement> elements = new Vector<TreeElement>();
		private TreeNodeWithElements lowNode = null;
		private TreeNodeWithElements highNode = null;
		
		public TreeNodeWithElements(int clusterId, Interval interval) throws Exception {
			node = new TreeNode(clusterId, interval);
		}
		
		public TreeNode getNode(){
			return node;
		}
		
		public void addElement(TreeElement element, Result results) throws Exception {
			
			if( null != lowNode && lowNode.includes(element) ){
				// It fits in low node
				lowNode.addElement(element, results);
				
			} else if( null != highNode && highNode.includes(element) ){
				// It fits in high node
				highNode.addElement(element, results);
				
			} else {
				elements.add(element);
				
				if( elements.size() > NODE_ELEMENT_THRESHOLD 
				 && null == lowNode ){
					// Time to create children nodes
					{
						Interval lowInterval = new Interval(node.getInterval().getMin(), node.getMidPoint());
						int lowClusterId = results.nextClusterId;
						results.nextClusterId++;
						lowNode = new TreeNodeWithElements(lowClusterId, lowInterval);
						node.setLowChildNode( lowNode.node );
						
						List<TreeElement> childElements = new ArrayList<TreeElement>(elements.size());
						for(TreeElement elem : elements){
							if( lowNode.includes(elem) ){
								childElements.add(elem);
								lowNode.addElement(elem, results);
							}
						}
						elements.removeAll(childElements);
					}

					{
						Interval highInterval = new Interval(node.getMidPoint(), node.getInterval().getMax());
						int highClusterId = results.nextClusterId;
						results.nextClusterId++;
						highNode = new TreeNodeWithElements(highClusterId, highInterval);
						node.setHighChildNode( highNode.node );
						
						List<TreeElement> childElements = new ArrayList<TreeElement>(elements.size());
						for(TreeElement elem : elements){
							if( highNode.includes(elem) ){
								childElements.add(elem);
								highNode.addElement(elem, results);
							}
						}
						elements.removeAll(childElements);
					}
				}
			}
		}

		private boolean includes(TreeElement element) {
			return element.getInterval().isIncludedIn( node.getInterval() );
		}
	}
	
	static TreeRebalanceProcess.Result createTree(List<? extends TreeElement> elements) throws Exception {
		Result results = new Result();

		// Compute full interval, next cluster id and legacy nodes
		Interval fullInterval = null;
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
		
		// Create root node for tree
		TreeNodeWithElements rootNodeWithElements = new TreeNodeWithElements(results.nextClusterId, fullInterval);
		results.nextClusterId++;
		for(TreeElement element : elements){
			rootNodeWithElements.addElement(element, results);
		}
		
		// Install root node in results
		results.rootNode = rootNodeWithElements.getNode();
		
		// Install legacy nodes in results
		results.legacyNodes.addAll( legacyNodes.values() );
		
		return results;
	}
}
