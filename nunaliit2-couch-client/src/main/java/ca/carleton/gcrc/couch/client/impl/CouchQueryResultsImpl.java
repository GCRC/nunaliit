package ca.carleton.gcrc.couch.client.impl;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.json.JSONSupport;

public class CouchQueryResultsImpl implements CouchQueryResults {

	private JSONObject top;
	private int total = 0;
	private int offset = 0;
	private List<JSONObject> rows = null;

	public CouchQueryResultsImpl(JSONObject top) throws Exception {
		this.top = top;
		
		if( JSONSupport.containsKey(top,"total") ) {
			total = top.getInt("total");
		}
		if( JSONSupport.containsKey(top,"offset") ) {
			offset = top.getInt("offset");
		}
		
		JSONArray rowArr = top.getJSONArray("rows");
		int size = rowArr.length();
		rows = new ArrayList<JSONObject>(size);
		for(int i=0; i<size; ++i) {
			rows.add( rowArr.getJSONObject(i) );
		}
	}
	
	@Override
	public JSONObject getFullResults() {
		return top;
	}
	
	@Override
	public int getTotal() {
		return total;
	}

	@Override
	public int getOffset() {
		return offset;
	}

	@Override
	public List<JSONObject> getRows() {
		return rows;
	}

	@Override
	public List<JSONObject> getValues() {
		List<JSONObject> result = new ArrayList<JSONObject>(rows.size());
		for(JSONObject row : rows) {
			JSONObject v = row.optJSONObject("value");
			if( null != v ) {
				result.add(v);
			}
		}
		return result;
	}
}
