package ca.carleton.gcrc.couch.date.cluster;

import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

/**
 * This is the implementation of a cluster tree. It accepts a number of elements
 * and builds an index. It creates a number of nodes to manage the various clusters
 * which ultimately are the keys to the index.
 * 
 * A tree is made of nodes in a tree arrangement. The tree holds to the root node.
 * 
 * There is also a list of legacy nodes. The legacy nodes represents clusters from a
 * previous tree. These clusters are still referenced in the database by documents. However,
 * there is no need for these nodes to be arranged in a tree since no more elements are
 * added to those nodes.
 */
public class Tree implements IntervalClusterTree {
	
	static public Tree restoreTree(JSONObject jsonTree, TreeOperations operations) throws Exception {

		int nextId = jsonTree.getInt("nextId");

		// Regular root node
		TreeNodeRegular regularNode = null;
		JSONObject regularRoot = jsonTree.optJSONObject("regularRoot");
		if( null == regularRoot ){
			if( null != jsonTree.opt("min") 
			 && null != jsonTree.opt("max")
			 && null != jsonTree.opt("mid") ){
				// Legacy image of tree.
				TreeNode node = restoreNode(jsonTree);
				if( node instanceof TreeNodeRegular ){
					regularNode = (TreeNodeRegular)node;
				} else {
					throw new Exception("Unexpected class for regular root node: "+node.getClass().getName());
				}
			}
		} else {
			TreeNode node = restoreNode(regularRoot);
			if( node instanceof TreeNodeRegular ){
				regularNode = (TreeNodeRegular)node;
			} else {
				throw new Exception("Unexpected class for regular root node: "+node.getClass().getName());
			}
		}
		if( null == regularNode ){
			TimeInterval interval = new TimeInterval(0, 1500000000000L);
			regularNode = new TreeNodeRegular(nextId, interval);
			++nextId;
		}
		
		// Ongoing root node
		TreeNodeOngoing ongoingNode = null;
		JSONObject nowRoot = jsonTree.optJSONObject("nowRoot");
		if( null != nowRoot ){
			TreeNode node = restoreNode(nowRoot);
			if( node instanceof TreeNodeOngoing ){
				ongoingNode = (TreeNodeOngoing)node;
			} else {
				throw new Exception("Unexpected class for now root node: "+node.getClass().getName());
			}
		}
		if( null == ongoingNode ){
			TimeInterval interval = new TimeInterval(0, (NowReference)null);
			ongoingNode = new TreeNodeOngoing(nextId, interval);
			++nextId;
		}
		
		Tree tree = new Tree(regularNode, ongoingNode, nextId, operations);
		
		JSONArray legacyNodes = jsonTree.optJSONArray("legacyNodes");
		if( null != legacyNodes ){
			for(int i=0,e=legacyNodes.length(); i<e; ++i){
				JSONObject jsonLegacyNode = legacyNodes.getJSONObject(i);
				TreeNode legacyNode = restoreNode(jsonLegacyNode);
				tree.addLegacyNode(legacyNode);
			}
		}
		
		return tree;
	}

	static private TreeNode restoreNode(JSONObject jsonTree) throws Exception {		
		int id = jsonTree.getInt("id");
		long min = jsonTree.getLong("min");
		long mid = jsonTree.getLong("mid");
		boolean ongoing = jsonTree.optBoolean("ongoing",false);

		if( ongoing ){
			TreeNodeOngoing node = new TreeNodeOngoing(id, min, mid);

			JSONObject jsonLowChild = jsonTree.optJSONObject("l");
			if( null != jsonLowChild ) {
				TreeNode childNode = restoreNode(jsonLowChild);
				if( childNode instanceof TreeNodeOngoing ){
					node.setLowChildNode((TreeNodeOngoing)childNode);
				} else {
					throw new Exception("Attempting to insert an invalid node in a "+TreeNodeOngoing.class.getName());
				}
			}

			JSONObject jsonHighChild = jsonTree.optJSONObject("h");
			if( null != jsonHighChild ) {
				TreeNode childNode = restoreNode(jsonHighChild);
				if( childNode instanceof TreeNodeOngoing ){
					node.setHighChildNode((TreeNodeOngoing)childNode);
				} else {
					throw new Exception("Attempting to insert an invalid node in a "+TreeNodeOngoing.class.getName());
				}
			}
			
			return node;
			
		} else {
			long max = jsonTree.getLong("max");
			TreeNodeRegular node = new TreeNodeRegular(id, min, max, mid);

			JSONObject jsonLowChild = jsonTree.optJSONObject("l");
			if( null != jsonLowChild ) {
				TreeNode childNode = restoreNode(jsonLowChild);
				if( childNode instanceof TreeNodeRegular ){
					node.setLowChildNode((TreeNodeRegular)childNode);
				} else {
					throw new Exception("Attempting to insert an invalid node in a "+TreeNodeRegular.class.getName());
				}
			}

			JSONObject jsonHighChild = jsonTree.optJSONObject("h");
			if( null != jsonHighChild ) {
				TreeNode childNode = restoreNode(jsonHighChild);
				if( childNode instanceof TreeNodeRegular ){
					node.setHighChildNode((TreeNodeRegular)childNode);
				} else {
					throw new Exception("Attempting to insert an invalid node in a "+TreeNodeRegular.class.getName());
				}
			}
			
			return node;
		}
	}

	static private JSONObject saveNode(TreeNode node) throws Exception {
		JSONObject jsonNode = new JSONObject();
		
		TimeInterval nodeInterval = node.getInterval();
		jsonNode.put("id", node.getClusterId());
		jsonNode.put("min", nodeInterval.getMin());
		if( nodeInterval.isOngoing() ){
			jsonNode.put("ongoing", true);
		} else {
			jsonNode.put("max", node.getInterval().getMax(null));
		}
		jsonNode.put("mid", node.getMidPoint());

		TreeNode lowChildNode = node.getLowChildNode();
		if( null != lowChildNode ){
			JSONObject jsonChild = saveNode(lowChildNode);
			jsonNode.put("l",jsonChild);
		}

		TreeNode highChildNode = node.getHighChildNode();
		if( null != highChildNode ){
			JSONObject jsonChild = saveNode(highChildNode);
			jsonNode.put("h",jsonChild);
		}
		
		return jsonNode;
	}
	
	static public void treeToDot(Tree tree, PrintWriter pw) throws Exception {
		
		List<TreeOperations.ClusterInfo> infoObjs = tree.getOperations().getAllClusterInfo();
		Map<Integer,TreeOperations.ClusterInfo> infoByClusterId = new HashMap<Integer,TreeOperations.ClusterInfo>();
		for(TreeOperations.ClusterInfo info : infoObjs){
			infoByClusterId.put(info.clusterId, info);
		}
		
		TreeOperations.ClusterInfo rootInfo = infoByClusterId.get(null);
		int rootCount = 0;
		if( null != rootInfo ) {
			rootCount = rootInfo.count;
		}
		
		pw.println("digraph date {");
		pw.println("ROOT [label=\"id:null,count:"+rootCount+"\"];");
		
		if( null != tree.regularRootNode ){
			nodeToDot(tree.regularRootNode, pw, infoByClusterId);
			pw.println("ROOT -> n"+tree.regularRootNode.getClusterId()+";");
		}

		if( null != tree.ongoingRootNode ){
			nodeToDot(tree.ongoingRootNode, pw, infoByClusterId);
			pw.println("ROOT -> n"+tree.ongoingRootNode.getClusterId()+";");
		}
		
		List<TreeNode> legacyNodes = tree.legacyNodes;
		if( null != legacyNodes ){
			for(TreeNode legacyNode : legacyNodes){
				nodeToDot(legacyNode, pw, infoByClusterId);
				pw.println("ROOT -> n"+legacyNode.getClusterId()+";");
			}
		}
		
		pw.println("}");
	}
	
	static public void nodeToDot(
			TreeNode node
			,PrintWriter pw
			,Map<Integer,TreeOperations.ClusterInfo> infoByClusterId) throws Exception{
		
		TreeOperations.ClusterInfo info = infoByClusterId.get(node.getClusterId());
		
		int count = 0;
		if( null != info ){
			count = info.count;
		}
		
		TimeInterval nodeInterval = node.getInterval();
		String minStr = ""+nodeInterval.getMin();
		String maxStr = "now";
		if( !nodeInterval.isOngoing() ){
			maxStr = ""+nodeInterval.getMax(null);
		}
		pw.println("n"+node.getClusterId()+" [label=\"id:"+node.getClusterId()+",count:"+count+",min:"+minStr+",max:"+maxStr+"\"];");
		
		if( null != node.getLowChildNode() ){
			nodeToDot(node.getLowChildNode(), pw, infoByClusterId);
			pw.println("n"+node.getClusterId()+" -> n"+node.getLowChildNode().getClusterId()+";");
		}
		
		if( null != node.getHighChildNode() ){
			nodeToDot(node.getHighChildNode(), pw, infoByClusterId);
			pw.println("n"+node.getClusterId()+" -> n"+node.getHighChildNode().getClusterId()+";");
		}
	}
	
	static private class TreeInfo {
		public int maxDepth = 0;
		public int nodeCount = 0;
		public int regularNodeCount = 0;
		public int ongoingNodeCount = 0;
		public int legacyNodeCount = 0;
		public long minInterval = 0;
	}
	
	static public void treeToInfo(Tree tree, PrintWriter pw) throws Exception {
		TreeInfo treeInfo = new TreeInfo();
		
		if( null != tree.getRegularRootNode() ){
			treeInfo.minInterval = tree.getRegularRootNode().getInterval().getSize(null);
		} else {
			treeInfo.minInterval = 0;
		}
		
		treeInfo.legacyNodeCount = tree.getLegacyNodes().size();
		
		if( null != tree.getRegularRootNode() ){
			nodeToInfo(tree.getRegularRootNode(), treeInfo, 1);
		}
		
		if( null != tree.getOngoingRootNode() ){
			nodeToInfo(tree.getOngoingRootNode(), treeInfo, 1);
		}
		
		pw.println("Node count: "+treeInfo.nodeCount);
		pw.println("Regular node count: "+treeInfo.regularNodeCount);
		pw.println("On-going node count: "+treeInfo.ongoingNodeCount);
		pw.println("Legacy node count: "+treeInfo.legacyNodeCount);
		pw.println("Max node depth: "+treeInfo.maxDepth);
		pw.println("Full interval: "+tree.getRegularRootNode().getInterval());
		pw.println("Min interval size: "+treeInfo.minInterval);
		
	}

	static private void nodeToInfo(TreeNode node, TreeInfo treeInfo, int depth) throws Exception {
		treeInfo.nodeCount++;
		
		if( treeInfo.maxDepth < depth ){
			treeInfo.maxDepth = depth;
		}
		
		if( node.getInterval().isOngoing() ) {
			++treeInfo.ongoingNodeCount;
			
		} else {
			++treeInfo.regularNodeCount;
			
			if( treeInfo.minInterval > node.getInterval().getSize(null) ){
				treeInfo.minInterval = node.getInterval().getSize(null);
			}
		}
		
		if( null != node.getLowChildNode() ){
			nodeToInfo(node.getLowChildNode(), treeInfo, depth+1);
		}
		
		if( null != node.getHighChildNode() ){
			nodeToInfo(node.getHighChildNode(), treeInfo, depth+1);
		}
	}

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private TreeOperations operations;
	private TreeNodeRegular regularRootNode;
	private TreeNodeOngoing ongoingRootNode;
	private int nextId = 1;
	private List<TreeNode> legacyNodes = new Vector<TreeNode>();
	
	public Tree(
		TreeNodeRegular regularRootNode, 
		TreeNodeOngoing ongoingRootNode, 
		int nextId, 
		TreeOperations operations ){
		
		this.regularRootNode = regularRootNode;
		this.ongoingRootNode = ongoingRootNode;
		this.nextId = nextId;
		this.operations = operations;
	}

	public Tree(TreeRebalanceProcess.Result treeInfo, TreeOperations operations){
		regularRootNode = treeInfo.regularRootNode;
		ongoingRootNode = treeInfo.ongoingRootNode;
		nextId = treeInfo.nextClusterId;
		legacyNodes.addAll( treeInfo.legacyNodes );
		this.operations = operations;
	}

	public TreeOperations getOperations(){
		return operations;
	}
	
	synchronized public TreeNodeRegular getRegularRootNode(){
		return regularRootNode;
	}
	
	synchronized public TreeNodeOngoing getOngoingRootNode(){
		return ongoingRootNode;
	}
	
	synchronized public int getNextClusterId(){
		return nextId;
	}
	
	synchronized public void setNextClusterId(int nextId){
		this.nextId = nextId;
	}
	
	synchronized public List<TreeNode> getLegacyNodes(){
		return legacyNodes;
	}

	synchronized public void addLegacyNode(TreeNode legacyNode) {
		legacyNodes.add(legacyNode);
	}

	synchronized public void clearLegacyNodes() {
		legacyNodes = new Vector<TreeNode>();
	}
	
	public void reload() throws Exception {
		Tree updatedTree = null;
		try {
			updatedTree = operations.loadTree();
		} catch (Exception e) {
			logger.info("Unable to reload tree",e);
		}
		
		if( null == updatedTree ){
			try {
				updatedTree = operations.recoverTree();
				
				logger.info("Recovered date cluster tree");
				
			} catch(Exception e) {
				logger.error("Unable to recover date cluster tree",e);
				throw new Exception("Unable to recover date cluster tree",e);
			}
		}

		synchronized(this){
			regularRootNode = updatedTree.getRegularRootNode();
			nextId = updatedTree.getNextClusterId();
			legacyNodes = updatedTree.getLegacyNodes();
		}
	}
	
	synchronized public JSONObject toJSON() throws Exception {
		JSONObject jsonObj = new JSONObject();
		
		JSONObject regularRoot = saveNode(regularRootNode);
		if( null != regularRoot ){
			jsonObj.put("regularRoot", regularRoot);
		}
		
		JSONObject nowRoot = saveNode(ongoingRootNode);
		if( null != nowRoot ){
			jsonObj.put("nowRoot", nowRoot);
		}
		
		jsonObj.put("nextId", nextId);
		
		if( legacyNodes.size() > 0 ){
			JSONArray jsonLegacyNodes = new JSONArray();
			
			for(TreeNode legacyNode : legacyNodes){
				JSONObject jsonChild = saveNode(legacyNode);
				jsonLegacyNodes.put(jsonChild);
			}
			
			jsonObj.put("legacyNodes", jsonLegacyNodes);
		}
		
		return jsonObj;
	}

	@Override
	synchronized public List<Integer> clusterIdsFromInterval(
			TimeInterval interval, 
			NowReference now) throws Exception {
		
		List<Integer> clusterIds = new Vector<Integer>();
		
		if( null != regularRootNode ){
			regularRootNode.accumulateClusterIdsFromInterval(interval, clusterIds, now);
		}
		
		if( null != ongoingRootNode ){
			ongoingRootNode.accumulateClusterIdsFromInterval(interval, clusterIds, now);
		}
		
		for(TreeNode legacyNode : legacyNodes){
			legacyNode.accumulateClusterIdsFromInterval(interval, clusterIds, now);
		}
		
		return clusterIds;
	}
}
