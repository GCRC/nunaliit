package ca.carleton.gcrc.couch.client;

import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

public class CouchQuery {

	private String viewName = null;
	private String listName = null;
	private String startKey = null;
	private String endKey = null;
	private String keys = null;
	private String limit = null;
	private String includeDocs = null;
	private boolean reduce = false;
	private boolean group = false;
	
	public String getViewName() {
		return viewName;
	}
	public void setViewName(String viewName) {
		this.viewName = viewName;
	}
	
	public String getListName() {
		return listName;
	}
	public void setListName(String listName) {
		this.listName = listName;
	}
	
	public String getStartKey() {
		return startKey;
	}
	public void setStartKey(String startKey) {
		this.startKey = JSONObject.quote(startKey);
	}
	public void setStartKey(Object startKey) throws Exception {
		this.startKey = JSONSupport.valueToString(startKey);
	}
	
	public String getEndKey() {
		return endKey;
	}
	public void setEndKey(String endKey) {
		this.endKey = JSONObject.quote(endKey);
	}
	public void setEndKey(Object endKey) throws Exception {
		this.endKey = JSONSupport.valueToString(endKey);
	}
	
	public String getKeys() {
		return keys;
	}
	public void setKeys(List<String> keys) {
		JSONArray arr = new JSONArray();
		for(String key : keys) {
			arr.put(key);
		}
		this.keys = arr.toString();
	}
	public void setKeys(Object keys) throws Exception {
		this.keys = JSONSupport.valueToString(keys);
	}
	public void resetKeys() {
		this.keys = null;
	}
	
	public String getLimit() {
		return limit;
	}
	public void setLimit(int limit) throws Exception {
		this.limit = JSONSupport.numberToString(limit);
	}
	
	public String getIncludeDocs() {
		return includeDocs;
	}
	public void setIncludeDocs(boolean includeDocs) throws Exception {
		this.includeDocs = JSONSupport.valueToString(includeDocs);
	}

	public boolean isReduce() {
		return reduce;
	}
	public void setReduce(boolean reduce) {
		this.reduce = reduce;
	}

	public boolean isGrouping() {
		return group;
	}
	public void setGrouping(boolean group) {
		this.group = group;
	}
}
