package ca.carleton.gcrc.couch.date.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.impl.CouchDbException;
import ca.carleton.gcrc.couch.date.cluster.CouchTreeOperations;
import ca.carleton.gcrc.couch.date.cluster.Tree;
import ca.carleton.gcrc.couch.date.cluster.TreeElement;
import ca.carleton.gcrc.couch.date.cluster.TreeInsertProcess;
import ca.carleton.gcrc.couch.date.cluster.TreeNode;
import ca.carleton.gcrc.couch.date.cluster.TreeOperations;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;

public class DateRobotThread extends Thread implements CouchDbChangeListener {
	
	static final public int DELAY_NO_WORK_POLLING = 5 * 1000; // 5 seconds
	static final public int DELAY_NO_WORK_MONITOR = 60 * 1000; // 1 minute
	static final public int DELAY_ERROR = 60 * 1000; // 1 minute
	static final public int DELAY_CLEAR_OLD_ERRORS = 5 * 60 * 1000; // 5 minutes
	
	static public class Work {
		public enum Type {
			PROCESS_DOC
			,RELOAD_TREE
			,TRIM_LEGACY_NODES
		};
		
		public Type type;
		public String docId;
	}

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private boolean isShuttingDown = false;
	private CouchDesignDocument atlasDesign;
	private DocumentsInError docsInError = new DocumentsInError();
	private Tree clusterTree;
	private boolean reloadTree = false;
	private int noWorkDelayInMs = DELAY_NO_WORK_POLLING;
	
	public DateRobotThread(CouchDesignDocument atlasDesign, Tree clusterTree) throws Exception {
		this.atlasDesign = atlasDesign;
		this.clusterTree = clusterTree;
		
		noWorkDelayInMs = DELAY_NO_WORK_POLLING;
		CouchDbChangeMonitor changeMonitor = atlasDesign.getDatabase().getChangeMonitor();
		if( null != changeMonitor ){
			changeMonitor.addChangeListener(this);
			noWorkDelayInMs = DELAY_NO_WORK_MONITOR;
		}
	}
	
	public void shutdown() {
		
		logger.info("Shutting down date worker thread");

		synchronized(this) {
			isShuttingDown = true;
			this.notifyAll();
		}
	}
	
	@Override
	public void run() {
		
		logger.info("Start date worker thread");
		
		boolean done = false;
		do {
			synchronized(this) {
				done = isShuttingDown;
			}
			if( false == done ) {
				activity();
			}
		} while( false == done );

		logger.info("Date worker thread exiting");
	}
	
	private void activity() {

		// Check for work
		Collection<Work> allWork = null;
		try {
			allWork = getWork();
			
		} catch (Exception e) {
			logger.error("Error obtaining work",e);
			waitMillis(DELAY_ERROR); // wait a minute
			return;
		}

		if( null == allWork || allWork.size() < 1 ) {
			// Nothing to do, remove old errors
			List<String> docIdsRecovered = docsInError.removeErrorsOlderThanMs(DELAY_CLEAR_OLD_ERRORS);

			if( docIdsRecovered.size() <= 0 ) {
				// No errors to get rid of and no work, wait
				waitMillis(noWorkDelayInMs);
				return;
			}
			
		} else {
			for(Work work : allWork){
				try {
					// Handle this work
					performWork(work);
					
				} catch(Exception e) {
					logger.error("Error performing work "+work.type,e);
					synchronized(this) {
						reloadTree = true;
					}
					return;
				}
			}
		}
	}

	private Collection<Work> getWork() throws Exception {
		List<Work> allWork = new Vector<Work>();

		boolean mustReloadTree = false;
		synchronized(this){
			mustReloadTree = reloadTree;
		}
		
		// Check if cluster date tree document was deleted
//		if( false == reloadTree ){
//			boolean exists = clusterTree.getOperations().treeExists();
//			if( false == exists ){
//				reloadTree = true;
//			}
//		}
		
		if( mustReloadTree ) {
			Work work = new Work();
			work.type = Work.Type.RELOAD_TREE;
			allWork.add(work);

		} else {
			Set<String> docIds = new HashSet<String>();

			// Check for work: all un-indexed date intervals
			{
				CouchQuery query = new CouchQuery();
				query.setViewName("date-index");
				query.setReduce(false);
				
				JSONArray keys = new JSONArray();
				keys.put(JSONObject.NULL);
				query.setKeys(keys);
		
				CouchQueryResults results = atlasDesign.performQuery(query);
				synchronized(this) { // protect docsInError
					for(JSONObject row : results.getRows()) {
						String id = row.optString("id");
						if( null != id 
						 && false == docsInError.isDocumentInError(id) ) {
							// Found some work
							docIds.add(id);
						}
					}
				}
			}

			// Check for work: all legacy nodes
			{
				List<TreeNode> legacyNodes = clusterTree.getLegacyNodes();
				if( legacyNodes.size() > 0 ){
					JSONArray keys = new JSONArray();
					for(TreeNode legacyNode : legacyNodes){
						keys.put(legacyNode.getClusterId());
					}

					CouchQuery query = new CouchQuery();
					query.setViewName("date-index");
					query.setReduce(false);
					query.setKeys(keys);
			
					CouchQueryResults results = atlasDesign.performQueryAsPost(query);
					synchronized(this) { // protect docsInError
						for(JSONObject row : results.getRows()) {
							String id = row.optString("id");
							if( null != id 
							 && false == docsInError.isDocumentInError(id) ) {
								// Found some work
								docIds.add(id);
							}
						}
					}
				}
			}
			
			for(String docId : docIds){
				Work work = new Work();
				work.type = Work.Type.PROCESS_DOC;
				work.docId = docId;
				allWork.add(work);
			}
		}
		
		if( allWork.size() < 1 ){
			// Check if legacy nodes need to be trimmed
			if( clusterTree.getLegacyNodes().size() > 0 ){
				Work work = new Work();
				work.type = Work.Type.TRIM_LEGACY_NODES;
				allWork.add(work);
			}
		}
		
		return allWork;
	}
	
	public void performWork(Work work) throws Exception {
		if( Work.Type.PROCESS_DOC == work.type ){
			try {
				performProcessDocument(work.docId);
			} catch(Exception e) {
				boolean shouldErrorBeTakenIntoAccount = true;
				for(Throwable t : errorAndCausesAsList(e)){
					if( t instanceof CouchDbException ){
						CouchDbException couchDbException = (CouchDbException)t;
						if( 409 == couchDbException.getReturnCode() ){
							// This is a conflict error in CouchDb. Somebody is updating the document
							// at the same time. Just retry the worl
							shouldErrorBeTakenIntoAccount = false;
						}
					}
				}
				
				if( shouldErrorBeTakenIntoAccount ){
					synchronized(this) {
						docsInError.addDocumentInError(work.docId);
					}
				} else {
					logger.info("Previous error for "+work.docId+" will be ignored. Should retry shortly.");
				}

				throw e;
			}
			
		} else if( Work.Type.RELOAD_TREE == work.type ) {
			performReloadTree();
			
		} else if( Work.Type.TRIM_LEGACY_NODES == work.type ) {
			performLegacyNodeTrimming();

		} else {
			throw new Exception("Unrecognized work: "+work.type);
		}
	}
	
	public void performProcessDocument(String docId) throws Exception {
		// Get submission document
		CouchDb db = atlasDesign.getDatabase();
		JSONObject jsonDoc = db.getDocument(docId);
		
		List<JSONObject> dateStructures = CouchNunaliitUtils.findStructuresOfType("date", jsonDoc);
		List<TreeElement> treeElements = new ArrayList<TreeElement>(dateStructures.size());
		for(JSONObject s : dateStructures){
			DateStructureElement e = new DateStructureElement(s);
			treeElements.add(e);
		}
		
		NowReference now = NowReference.now();
		TreeInsertProcess.Result treeInsertInfo = TreeInsertProcess.insertElements(clusterTree, treeElements, now);
		
		if( treeInsertInfo.isTreeModified() ){
			TreeOperations ops = clusterTree.getOperations();
			ops.saveTree(clusterTree);
			logger.info("Modified cluster tree");
		}
		
		// Update content of document
		boolean documentUpdated = false;
		Map<Integer,List<TreeElement>> insertions = treeInsertInfo.getInsertions();
		for(Integer clusterId : insertions.keySet()){
			for(TreeElement treeElement : insertions.get(clusterId)){
				if( treeElement instanceof DateStructureElement ){
					DateStructureElement e = (DateStructureElement)treeElement;
					if( clusterId != e.getClusterId() ){
						e.setClusterId(clusterId);
						documentUpdated = true;
					}
				}
			}
		}
		if( documentUpdated ) {
			db.updateDocument(jsonDoc);
			logger.info("Indexed date structures: "+jsonDoc.getString("_id"));
		}
	}
	
	private void performReloadTree() throws Exception {
		try {
			clusterTree.reload();
			reloadTree = false;
			
		} catch (Exception e) {
			throw new Exception("Error reloading cluster tree",e);
		}
	}
	
	private void performLegacyNodeTrimming() throws Exception {
		TreeOperations ops = clusterTree.getOperations();
		clusterTree.clearLegacyNodes();
		ops.saveTree(clusterTree);
		logger.info("Cleared legacy nodes");
	}

	private boolean waitMillis(int millis) {
		synchronized(this) {
			if( true == isShuttingDown ) {
				return false;
			}
			
			try {
				this.wait(millis);
			} catch (InterruptedException e) {
				// Interrupted
				return false;
			}
		}
		
		return true;
	}

	@Override
	public void change(
			CouchDbChangeListener.Type type
			,String docId
			,String rev
			,JSONObject rawChange
			,JSONObject doc
			) {
		synchronized(this){
			docsInError.removeErrorsWithDocId(docId);
			if( CouchTreeOperations.DATE_CLUSTER_DOC_ID.equals(docId) ){
				reloadTree = true;
			}
			this.notifyAll();
		}
	}

	private List<Throwable> errorAndCausesAsList(Throwable e){
		List<Throwable> errors = new Vector<Throwable>();
		
		errors.add(e);
		
		// Add causes
		Throwable cause = e.getCause();
		while( null != cause && errors.indexOf(cause) < 0 ){
			errors.add(cause);
			cause = e.getCause();
		}
		
		return errors;
	};
}
