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

import ca.carleton.gcrc.couch.date.impl.Interval;

public class Tree implements IntervalClusterTree {
	
	static public Tree restoreTree(JSONObject jsonTree, TreeOperations operations) throws Exception {
		TreeNode node = restoreNode(jsonTree);
		int nextId = jsonTree.getInt("nextId");
		
		Tree tree = new Tree(node, nextId, operations);
		
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
		long max = jsonTree.getLong("max");
		long mid = jsonTree.getLong("mid");
		
		TreeNode node = new TreeNode(id, min, max, mid);

		JSONObject jsonLowChild = jsonTree.optJSONObject("l");
		if( null != jsonLowChild ) {
			TreeNode childNode = restoreNode(jsonLowChild);
			node.setLowChildNode(childNode);
		}

		JSONObject jsonHighChild = jsonTree.optJSONObject("h");
		if( null != jsonHighChild ) {
			TreeNode childNode = restoreNode(jsonHighChild);
			node.setHighChildNode(childNode);
		}
		
		return node;
	}

	static private JSONObject saveNode(TreeNode node) throws Exception {
		JSONObject jsonNode = new JSONObject();
		
		jsonNode.put("id", node.getClusterId());
		jsonNode.put("min", node.getInterval().getMin());
		jsonNode.put("max", node.getInterval().getMax());
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
		pw.println("ROOT [label=\""+rootCount+"\"];");
		
		nodeToDot(tree.rootNode, pw, infoByClusterId);
		pw.println("ROOT -> n"+tree.rootNode.getClusterId()+";");
		
		List<TreeNode> legacyNodes = tree.legacyNodes;
		if( null != legacyNodes ){
			for(TreeNode legacyNode : legacyNodes){
				nodeToDot(legacyNode, pw, infoByClusterId);
				pw.println("ROOT -> n"+legacyNode.getClusterId()+";");
			}
		}
		
		pw.println("}");
	}
	
	static public void nodeToDot(TreeNode node, PrintWriter pw, Map<Integer,TreeOperations.ClusterInfo> infoByClusterId){
		
		TreeOperations.ClusterInfo info = infoByClusterId.get(node.getClusterId());
		
		int count = 0;
		if( null != info ){
			count = info.count;
		}
		
		pw.println("n"+node.getClusterId()+" [label=\""+count+","+node.getInterval().getMin()+","
				+node.getInterval().getMax()+"\"];");
		
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
		public int legacyNodeCount = 0;
		public long minInterval = 0;
	}
	
	static public void treeToInfo(Tree tree, PrintWriter pw){
		TreeInfo treeInfo = new TreeInfo();
		treeInfo.minInterval = tree.getRootNode().getInterval().getSize();
		
		treeInfo.legacyNodeCount = tree.getLegacyNodes().size();
		
		nodeToInfo(tree.getRootNode(), treeInfo, 1);
		
		pw.println("Node count: "+treeInfo.nodeCount);
		pw.println("Legacy node count: "+treeInfo.legacyNodeCount);
		pw.println("Max node depth: "+treeInfo.maxDepth);
		pw.println("Full interval: "+tree.getRootNode().getInterval());
		pw.println("Min interval size: "+treeInfo.minInterval);
		
	}

	static private void nodeToInfo(TreeNode node, TreeInfo treeInfo, int depth){
		treeInfo.nodeCount++;
		
		if( treeInfo.maxDepth < depth ){
			treeInfo.maxDepth = depth;
		}
		
		if( treeInfo.minInterval > node.getInterval().getSize() ){
			treeInfo.minInterval = node.getInterval().getSize();
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
	private TreeNode rootNode;
	private int nextId = 1;
	private List<TreeNode> legacyNodes = new Vector<TreeNode>();
	
	public Tree(TreeNode rootNode, int nextId, TreeOperations operations){
		this.rootNode = rootNode;
		this.nextId = nextId;
		this.operations = operations;
	}

	public Tree(TreeRebalanceProcess.Result treeInfo, TreeOperations operations){
		rootNode = treeInfo.rootNode;
		nextId = treeInfo.nextClusterId;
		legacyNodes.addAll( treeInfo.legacyNodes );
		this.operations = operations;
	}

	public TreeOperations getOperations(){
		return operations;
	}
	
	synchronized public TreeNode getRootNode(){
		return rootNode;
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
			rootNode = updatedTree.getRootNode();
			nextId = updatedTree.getNextClusterId();
			legacyNodes = updatedTree.getLegacyNodes();
		}
	}
	
	synchronized public JSONObject toJSON() throws Exception {
		JSONObject jsonObj = saveNode(rootNode);
		
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
	synchronized public List<Integer> clusterIdsFromInterval(Interval interval) {
		List<Integer> clusterIds = new Vector<Integer>();
		
		for(TreeNode legacyNode : legacyNodes){
			legacyNode.accumulateClusterIdsFromInterval(interval, clusterIds);
		}
		
		if( null != rootNode ){
			rootNode.accumulateClusterIdsFromInterval(interval, clusterIds);
		}
		
		return clusterIds;
	}
}
