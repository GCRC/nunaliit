package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

public interface TreeOperations {
	
	public class ClusterInfo {
		Integer clusterId;
		long min;
		long max;
		int count;
	}

	List<TreeElement> getAllElements() throws Exception;
	
	List<TreeElement> getElementsForClusterId(int clusterId) throws Exception;
	
	boolean treeExists() throws Exception;

	Tree loadTree() throws Exception;

	Tree recoverTree() throws Exception;
	
	void saveTree(Tree clusterTree) throws Exception;
	
	List<ClusterInfo> getAllClusterInfo() throws Exception;
}
