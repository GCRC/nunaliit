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

	static final public int NODE_ELEMENT_THRESHOLD = 32;

	/**
	 * Results of inserting elements in a cluster tree. Reports
	 * if the tree was modified and where each element is
	 * inserted.
	 */
	static public interface Result {

		boolean isTreeModified();
		
		Map<Integer,List<TreeElement>> getInsertions();
		
	}

	static public class ResultImpl implements Result {
		private Tree tree;
		private boolean treeModified = false;
		private Map<Integer,List<TreeElement>> insertions = new HashMap<Integer,List<TreeElement>>();
		
		public ResultImpl(Tree tree){
			this.tree = tree;
		}
		
		@Override
		public boolean isTreeModified() {
			return treeModified;
		}
		
		public void setTreeModified(boolean treeModified){
			this.treeModified = treeModified;
		}
		
		@Override
		public Map<Integer,List<TreeElement>> getInsertions() {
			return insertions;
		}
		
		public int getNextClusterId(){
			int nextId = tree.getNextClusterId();
			tree.setNextClusterId(nextId+1);
			treeModified = true;
			return nextId;
		}
		
		public void insert(int clusterId, TreeElement element){
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
		
		ResultImpl result = new ResultImpl(tree);
		
		TreeNodeRegular regularRootNode = tree.getRegularRootNode();
		TreeNodeOngoing ongoingRootNode = tree.getOngoingRootNode();
		for(TreeElement element : elements){
			TimeInterval elementInterval = element.getInterval();
			
			if( elementInterval.isOngoing() ){
				ongoingRootNode.insertElement(element, result, tree.getOperations(), now);
			} else {
				regularRootNode.insertElement(element, result, tree.getOperations(), now);
			}
		}
		
		return result;
	}
}
