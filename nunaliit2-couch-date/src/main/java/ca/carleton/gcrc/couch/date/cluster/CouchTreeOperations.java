package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class CouchTreeOperations implements TreeOperations {

	private CouchDesignDocument atlasDesign;
	
	public CouchTreeOperations(CouchDesignDocument atlasDesign){
		this.atlasDesign = atlasDesign;
	}
	
	@Override
	public List<TreeElement> getElementsForClusterId(int clusterId) throws Exception {
		List<TreeElement> elements = new Vector<TreeElement>();
		
		JSONArray keys = new JSONArray();
		keys.put(clusterId);
		
		CouchQuery query = new CouchQuery();
		query.setViewName("date-index");
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
			JSONArray jsonInterval = row.getJSONArray("value");
			
			CouchTreeElement element = new CouchTreeElement(
					docId, 
					elemClusterId, 
					jsonInterval.getLong(0), 
					jsonInterval.getLong(1)
					);
			elements.add(element);
		}
		
		return elements;
	}

}
