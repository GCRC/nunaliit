package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.couch.date.impl.Interval;
import junit.framework.TestCase;

public class TreeRebalanceProcessTest extends TestCase {

	static void addTreeElement(List<TreeElement> elements, Integer clusterId, long min, long max) throws Exception {
		TreeElementBase elem = new TreeElementBase(clusterId, min, max);
		elements.add( elem );
	}
	
	public void testCreateTree() throws Exception {
		List<TreeElement> elements = new Vector<TreeElement>();
		addTreeElement(elements, null, -5, -4);
		addTreeElement(elements, null, -5, -3);
		addTreeElement(elements, null, -4, 0);
		addTreeElement(elements, null, -4, 1);
		addTreeElement(elements, null, -1, 4);
		addTreeElement(elements, null, 0, 4);
		addTreeElement(elements, null, 1, 2);
		addTreeElement(elements, null, 2, 3);
		addTreeElement(elements, null, 3, 4);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		addTreeElement(elements, null, 4, 5);
		
		TreeRebalanceProcess.Result treeInfo = TreeRebalanceProcess.createTree(elements);
		Tree tree = new Tree(treeInfo, (TreeOperations)null);
		
		TreeNode rootNode = tree.getRootNode();
		if(rootNode.getInterval().getMin() != -5){
			fail("Unexpected min: "+rootNode.getInterval().getMin());
		}
		if(rootNode.getInterval().getMax() != 5){
			fail("Unexpected max: "+rootNode.getInterval().getMax());
		}
		
		long mid = rootNode.getMidPoint();
		if( 0 != mid ){
			fail("Unexpected mid point: "+mid);
		}
		
		Interval lowInt = new Interval(-5,mid);
		if( false == lowInt.equals( rootNode.getLowChildNode().getInterval() ) ){
			fail("Unexpected interval for low node: "+rootNode.getLowChildNode().getInterval());
		}
		
		Interval highInt = new Interval(mid,5);
		if( false == highInt.equals( rootNode.getHighChildNode().getInterval() ) ){
			fail("Unexpected interval for high node: "+rootNode.getHighChildNode().getInterval());
		}
	}
	
	public void testRecoverTree() throws Exception {
		List<TreeElement> elements = new Vector<TreeElement>();
		addTreeElement(elements, null, -5, -4);
		addTreeElement(elements, null, -5, -3);
		addTreeElement(elements, null, -4, 0);
		addTreeElement(elements, null, -4, 1);
		addTreeElement(elements, null, -1, 4);
		addTreeElement(elements, 1, 0, 4);
		addTreeElement(elements, 2, 1, 2);
		addTreeElement(elements, null, 2, 3);
		addTreeElement(elements, null, 3, 4);
		addTreeElement(elements, 3, 4, 5);
		
		TreeRebalanceProcess.Result treeInfo = TreeRebalanceProcess.createTree(elements);
		Tree tree = new Tree(treeInfo, (TreeOperations)null);
		
		TreeNode rootNode = tree.getRootNode();
		if(rootNode.getInterval().getMin() != -5){
			fail("Unexpected min: "+rootNode.getInterval().getMin());
		}
		if(rootNode.getInterval().getMax() != 5){
			fail("Unexpected max: "+rootNode.getInterval().getMax());
		}

		if( 3 != tree.getLegacyNodes().size() ){
			fail("Unexpected number of legacy nodes: "+tree.getLegacyNodes().size());
		}
	}
}
