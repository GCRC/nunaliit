package ca.carleton.gcrc.couch.date.cluster;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public class CouchIntervalClusterTreeFactory {
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	public Tree createClusterTree(CouchDesignDocument atlasDesign) throws Exception {
		
		CouchTreeOperations operations = new CouchTreeOperations(atlasDesign);

		return createClusterTree(operations);
	}

	public Tree createClusterTree(CouchTreeOperations operations) throws Exception {
		
		Tree tree = null;
		try {
			tree = operations.loadTree();
		} catch (Exception e) {
			// Ignore for now
			logger.info("Unable to retrieve date cluster information", e);
		}
		
		if( null == tree ){
			try {
				tree = operations.recoverTree();
				
				logger.info("Recovered date cluster tree");
				
			} catch(Exception e) {
				logger.error("Unable to recover date cluster tree",e);
				throw new Exception("Unable to recover date cluster tree",e);
			}
		}
		
		return tree;
	}
}
