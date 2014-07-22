package ca.carleton.gcrc.couch.date.cluster;

import java.io.PrintWriter;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

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
	
	static public void treeToDot(Tree tree, PrintWriter pw){
		pw.println("digraph date {");
		pw.println("ROOT;");
		
		nodeToDot(tree.rootNode, pw);
		pw.println("ROOT -> n"+tree.rootNode.getClusterId()+";");
		
		List<TreeNode> legacyNodes = tree.legacyNodes;
		if( null != legacyNodes ){
			for(TreeNode legacyNode : legacyNodes){
				nodeToDot(legacyNode, pw);
				pw.println("ROOT -> n"+legacyNode.getClusterId()+";");
			}
		}
		
		pw.println("}");
	}
	
	static public void nodeToDot(TreeNode node, PrintWriter pw){
		pw.println("n"+node.getClusterId()+" [label=\""+node.getInterval().getMin()+","
				+node.getMidPoint()+","
				+node.getInterval().getMax()+"\"];");
		
		if( null != node.getLowChildNode() ){
			nodeToDot(node.getLowChildNode(), pw);
			pw.println("n"+node.getClusterId()+" -> n"+node.getLowChildNode().getClusterId()+";");
		}
		
		if( null != node.getHighChildNode() ){
			nodeToDot(node.getHighChildNode(), pw);
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
	
	public TreeNode getRootNode(){
		return rootNode;
	}
	
	public int getNextClusterId(){
		return nextId;
	}
	
	public void setNextClusterId(int nextId){
		this.nextId = nextId;
	}
	
	public List<TreeNode> getLegacyNodes(){
		return legacyNodes;
	}

	public void addLegacyNode(TreeNode legacyNode) {
		legacyNodes.add(legacyNode);
	}
	
	public JSONObject toJSON() throws Exception {
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
	public List<Integer> clusterIdsFromInterval(Interval interval) {
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
