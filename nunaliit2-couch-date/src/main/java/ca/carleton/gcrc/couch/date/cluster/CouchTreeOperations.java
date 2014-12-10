package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;

public class CouchTreeOperations implements TreeOperations {
	
	final static public String DATE_CLUSTER_DOC_ID = "org.nunaliit.date_clusters";

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDesignDocument atlasDesign;
	
	public CouchTreeOperations(CouchDesignDocument atlasDesign){
		this.atlasDesign = atlasDesign;
	}

	@Override
	public List<TreeElement> getAllElements() throws Exception {
		List<TreeElement> elements = new Vector<TreeElement>();

		CouchQuery query = new CouchQuery();
		query.setViewName("date-index");
		query.setReduce(false);
		CouchQueryResults result = atlasDesign.performQuery(query);
		for(JSONObject row : result.getRows()){
			String docId = row.getString("id");
			Integer clusterId = null;
			{
				Object indexObj = row.get("key");
				if( JSONObject.NULL.equals(indexObj) ){
					indexObj = null;
				}
				if( null != indexObj ){
					clusterId = row.getInt("key");
				}
			}

			JSONObject jsonInterval = row.getJSONObject("value");
			TimeInterval timeInterval = TimeInterval.fromJson(jsonInterval);
			
			CouchTreeElement element = new CouchTreeElement(
					docId, 
					clusterId, 
					timeInterval
					);
			elements.add(element);
		}
		
		return elements;
	}
	
	@Override
	public List<TreeElement> getElementsForClusterId(int clusterId) throws Exception {
		List<TreeElement> elements = new Vector<TreeElement>();
		
		JSONArray keys = new JSONArray();
		keys.put(clusterId);
		
		CouchQuery query = new CouchQuery();
		query.setViewName("date-index");
		query.setReduce(false);
		query.setKeys(keys);
		CouchQueryResults result = atlasDesign.performQuery(query);
		for(JSONObject row : result.getRows()){
			String docId = row.getString("id");
			Integer elemClusterId = null;
			{
				Object indexObj = row.get("key");
				if( JSONObject.NULL.equals(indexObj) ){
					indexObj = null;
				}
				if( null != indexObj ){
					elemClusterId = row.getInt("key");
				}
			}
			
			JSONObject jsonInterval = row.getJSONObject("value");
			TimeInterval timeInterval = TimeInterval.fromJson(jsonInterval);
			
			CouchTreeElement element = new CouchTreeElement(
					docId, 
					elemClusterId, 
					timeInterval
					);
			elements.add(element);
		}
		
		return elements;
	}

	@Override
	public boolean treeExists() throws Exception {
		CouchDb db = atlasDesign.getDatabase();
		boolean exists = false;
		
		try {
			exists = db.documentExists(DATE_CLUSTER_DOC_ID);
			
		} catch (Exception e) {
			// Ignore for now
			throw new Exception("Unable to verify cluster document existence", e);
		}
		
		return exists;
	}

	@Override
	public Tree loadTree() throws Exception {
		CouchDb db = atlasDesign.getDatabase();
		JSONObject jsonDoc = null; 
		try {
			jsonDoc = db.getDocument(DATE_CLUSTER_DOC_ID);
		} catch (Exception e) {
			// Ignore for now
			throw new Exception("Unable to retrieve date cluster information", e);
		}
		
		// Rebuild tree from node information
		Tree tree = null;
		try {
			JSONObject jsonTree = jsonDoc.optJSONObject("nunaliit_date_clusters");
			tree = Tree.restoreTree(jsonTree, this);

		} catch (Exception e) {
			throw new Exception("Unable to parse date cluster data", e);
		}
		
		return tree;
	}

	@Override
	public Tree recoverTree() throws Exception {
		
		List<TreeElement> elements = null;
		try {
			elements = getAllElements();
		} catch (Exception e) {
			throw new Exception("Unable to retrieve date interval elements",e);
		}
		
		// Create tree from information
		Tree tree = null;
		try {
			TreeRebalanceProcess.Result treeInfo = TreeRebalanceProcess.createTree(elements);
			tree = new Tree(treeInfo, this);
		} catch (Exception e) {
			throw new Exception("Error while rebalancing the date cluster tree",e);
		}
		
		// Save new tree
		try {
			saveTree(tree);
		} catch (Exception e) {
			throw new Exception("Unable to save recovered cluster tree",e);
		}
		
		return tree;
	}

	@Override
	public void saveTree(Tree tree) throws Exception {
		
		CouchDb db = atlasDesign.getDatabase();

		boolean exists = db.documentExists(DATE_CLUSTER_DOC_ID);
		
		JSONObject jsonDoc = null;
		if( exists ) {
			jsonDoc = db.getDocument(DATE_CLUSTER_DOC_ID);
		} else {
			jsonDoc = new JSONObject();
			jsonDoc.put("_id", "org.nunaliit.date_clusters");
		}

		jsonDoc.put("nunaliit_date_clusters", tree.toJSON());
		CouchAuthenticationContext authContext = db.getClient().getSession().getAuthenticationContext();
		CouchNunaliitUtils.adjustDocumentForStorage(jsonDoc, authContext);
		if( exists ){
			db.updateDocument(jsonDoc);
		} else {
			db.createDocument(jsonDoc);
		}
	}

	@Override
	public List<ClusterInfo> getAllClusterInfo() throws Exception {
		List<ClusterInfo> infoObjs = new Vector<ClusterInfo>();

		CouchQuery query = new CouchQuery();
		query.setViewName("date-index");
		query.setReduce(true);
		query.setGrouping(true);
		CouchQueryResults result = atlasDesign.performQuery(query);
		for(JSONObject row : result.getRows()){
			Integer clusterId = null;
			{
				Object indexObj = row.get("key");
				if( JSONObject.NULL.equals(indexObj) ){
					indexObj = null;
				}
				if( null != indexObj ){
					clusterId = row.getInt("key");
				}
			}
			JSONObject jsonInfo = row.getJSONObject("value");
			
			ClusterInfo info = new ClusterInfo();
			info.clusterId = clusterId;
			info.min = jsonInfo.getLong("min");
			info.count = jsonInfo.getInt("count");
			info.ongoing = jsonInfo.optBoolean("ongoing",false);
			if( info.ongoing ){
				info.max = info.min;
			} else {
				info.max = jsonInfo.getLong("max");
			}
			
			infoObjs.add(info);
		}
		
		return infoObjs;
	}
}
