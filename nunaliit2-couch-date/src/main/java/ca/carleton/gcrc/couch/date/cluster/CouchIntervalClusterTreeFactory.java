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
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;

public class CouchIntervalClusterTreeFactory {
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	public Tree createClusterTree(CouchDesignDocument atlasDesign) throws Exception {
		
		CouchTreeOperations operations = new CouchTreeOperations(atlasDesign);
		
		CouchDb db = atlasDesign.getDatabase();
		JSONObject jsonDoc = null; 
		try {
			jsonDoc = db.getDocument("org.nunaliit.date_clusters");
		} catch (Exception e) {
			// Ignore for now
			logger.info("Unable to retrieve date cluster information", e);
		}
		
		Tree tree = null;
		if( null != jsonDoc ){
			// Rebuild tree from node information
			try {
				JSONObject jsonTree = jsonDoc.optJSONObject("nunaliit_date_clusters");
				tree = Tree.restoreTree(jsonTree, operations);
				
				logger.info("Restored date cluster tree");

			} catch (Exception e) {
				logger.info("Unable to parse date cluster data", e);
			}
		}
		
		if( null == tree ){
			try {
				// Recover tree
				List<CouchTreeElement> elements = new Vector<CouchTreeElement>();
				
				CouchQuery query = new CouchQuery();
				query.setViewName("date-index");
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
					JSONArray jsonInterval = row.getJSONArray("value");
					
					CouchTreeElement element = new CouchTreeElement(
							docId, 
							clusterId, 
							jsonInterval.getLong(0), 
							jsonInterval.getLong(1)
							);
					elements.add(element);
				}
				
				// Create tree from information
				TreeRebalanceProcess.Result treeInfo = TreeRebalanceProcess.createTree(elements);
				tree = new Tree(treeInfo, operations);
				
				// Save new tree
				boolean create = false;
				if( null == jsonDoc ){
					jsonDoc = new JSONObject();
					jsonDoc.put("_id", "org.nunaliit.date_clusters");
					create = true;
				}
				jsonDoc.put("nunaliit_date_clusters", tree.toJSON());
				CouchAuthenticationContext authContext = db.getClient().getSession().getAuthenticationContext();
				CouchNunaliitUtils.adjustDocumentForStorage(jsonDoc, authContext);
				if( create ){
					db.createDocument(jsonDoc);
				} else {
					db.updateDocument(jsonDoc);
				}
				
				logger.info("Recovered date cluster tree");
				
			} catch(Exception e) {
				logger.error("Unable to recover date cluster tree",e);
				throw new Exception("Unable to recover date cluster tree",e);
			}
		}
		
		return tree;
	}
}
