package ca.carleton.gcrc.couch.date.cluster;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.couch.date.impl.Interval;

public class TreeInsertProcess {

	static final int NODE_ELEMENT_THRESHOLD = 32;

	static public class Result {
		private Tree tree;
		private boolean treeModified = false;
		private Map<Integer,List<TreeElement>> insertions = new HashMap<Integer,List<TreeElement>>();
		
		public Result(Tree tree){
			this.tree = tree;
		}
		
		public boolean isTreeModified() {
			return treeModified;
		}
		
		public Map<Integer,List<TreeElement>> getInsertions() {
			return insertions;
		}
		
		protected int getNextClusterId(){
			int nextId = tree.getNextClusterId();
			tree.setNextClusterId(nextId+1);
			treeModified = true;
			return nextId;
		}
		
		protected void insert(int clusterId, TreeElement element){
			List<TreeElement> elements = insertions.get(clusterId);
			if( null == elements ){
				elements = new Vector<TreeElement>();
				insertions.put(clusterId,elements);
			}
			elements.add(element);
		}
	}
	
	static public Result insertElements(Tree tree, List<TreeElement> elements) throws Exception{
		
		Result result = new Result(tree);
		
		TreeNode rootNode = tree.getRootNode();
		for(TreeElement element : elements){
			insertElement(rootNode, element, result, tree.getOperations());
		}
		
		return result;
	}

	private static void insertElement(
			TreeNode node, 
			TreeElement element, 
			Result result, 
			TreeOperations operations) throws Exception {
		Interval elemInt = element.getInterval();
		
		if( false == elemInt.isIncludedIn(node.getInterval()) ){
			// Must grow interval
			node.extendTo( element.getInterval() );
			result.treeModified = true;
		}
		
		if( elemInt.getMax() <= node.getMidPoint() 
		 && null != node.getLowChildNode() ){
			insertElement(node.getLowChildNode(), element, result, operations);
			
		} else if( elemInt.getMin() >= node.getMidPoint() 
		 && null != node.getHighChildNode() ){
			insertElement(node.getHighChildNode(), element, result, operations);
		
		} else {
			// Check if low should be created
			if( null == node.getLowChildNode() 
			 && elemInt.getMax() <= node.getMidPoint() ){
				int count = 1;
				List<TreeElement> nodeElements = operations.getElementsForClusterId(node.getClusterId());
				for(TreeElement nodeElement : nodeElements){
					if( nodeElement.getInterval().getMax() <= node.getMidPoint() ){
						++count;
					}
				}
				if( count > NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					Interval childInt = new Interval(node.getInterval().getMin(), node.getMidPoint());
					TreeNode childNode = new TreeNode(clusterId,childInt);
					node.setLowChildNode(childNode);
					result.treeModified = true;
					
					result.insert(clusterId, element);
					return; // done
				}
			}
			
			// Check if high should be created
			if( null == node.getHighChildNode() 
			 && elemInt.getMin() >= node.getMidPoint() ){
				int count = 1;
				List<TreeElement> nodeElements = operations.getElementsForClusterId(node.getClusterId());
				for(TreeElement nodeElement : nodeElements){
					if( nodeElement.getInterval().getMin() >= node.getMidPoint() ){
						++count;
					}
				}
				if( count > NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					Interval childInt = new Interval(node.getMidPoint(), node.getInterval().getMax());
					TreeNode childNode = new TreeNode(clusterId,childInt);
					node.setHighChildNode(childNode);
					result.treeModified = true;
					
					result.insert(clusterId, element);
					return; // done
				}
			}
			
			// If we make it this far, we should insert at this level
			result.insert(node.getClusterId(), element);
		}
	}
}
