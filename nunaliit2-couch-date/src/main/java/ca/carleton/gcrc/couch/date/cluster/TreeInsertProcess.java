package ca.carleton.gcrc.couch.date.cluster;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

/**
 * This class is used to insert a new element in the cluster tree.
 *
 */
public class TreeInsertProcess {

	static final int NODE_ELEMENT_THRESHOLD = 32;

	/**
	 * Results of inserting elements in a cluster tree. Reports
	 * if the tree was modified and where each element is
	 * inserted.
	 */
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
	
	/**
	 * Modifies a cluster tree as a result of adding a new elements in the
	 * tree.
	 * @param tree Tree where the element is inserted.
	 * @param elements Elements to be inserted in the tree
	 * @return Results of inserting the elements
	 * @throws Exception
	 */
	static public Result insertElements(Tree tree, List<TreeElement> elements, NowReference now) throws Exception {
		
		Result result = new Result(tree);
		
		TreeNode rootNode = tree.getRootNode();
		for(TreeElement element : elements){
			insertElement(rootNode, element, result, tree.getOperations(), now);
		}
		
		return result;
	}

	private static void insertElement(
			TreeNode node, 
			TreeElement element, 
			Result result, 
			TreeOperations operations,
			NowReference now) throws Exception {
		TimeInterval elemInt = element.getInterval();
		
		if( false == elemInt.isIncludedIn(node.getInterval(), now) ){
			// Must grow interval
			node.extendTo( element.getInterval() );
			result.treeModified = true;
		}
		
		if( elemInt.getMax(now) <= node.getMidPoint() 
		 && null != node.getLowChildNode() ){
			insertElement(node.getLowChildNode(), element, result, operations, now);
			
		} else if( elemInt.getMin() >= node.getMidPoint() 
		 && null != node.getHighChildNode() ){
			insertElement(node.getHighChildNode(), element, result, operations, now);
		
		} else {
			// Check if low should be created
			if( null == node.getLowChildNode() 
			 && elemInt.getMax(now) <= node.getMidPoint() ){
				int count = 1;
				List<TreeElement> nodeElements = operations.getElementsForClusterId(node.getClusterId());
				for(TreeElement nodeElement : nodeElements){
					if( nodeElement.getInterval().getMax(now) <= node.getMidPoint() ){
						++count;
					}
				}
				if( count > NODE_ELEMENT_THRESHOLD ){
					// Should create low
					int clusterId = result.getNextClusterId();
					TreeNode childNode = new TreeNode(clusterId,elemInt);
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
					TreeNode childNode = new TreeNode(clusterId,elemInt);
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
