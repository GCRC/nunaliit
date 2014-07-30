package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

public abstract class AbstractDescriptor {

	protected abstract JSONObject getJson() throws Exception;
	
	protected String getStringAttribute(String key) throws Exception {
		String value = null;

		JSONObject json = getJson();
		if( JSONSupport.containsKey(json, key) ) {
			value = json.getString(key);
		}
		
		return value;
	}
	
	protected void setStringAttribute(String key, String value) throws Exception {
		JSONObject json = getJson();
		json.put(key,value);
	}

	protected boolean getBooleanAttribute(String key) throws Exception {
		boolean value = false;

		JSONObject json = getJson();
		if( JSONSupport.containsKey(json, key) ) {
			value = json.getBoolean(key);
		}
		
		return value;
	}
	
	protected void setBooleanAttribute(String key, boolean value) throws Exception {
		JSONObject json = getJson();
		json.put(key, value);
	}

	protected long getLongAttribute(String key) throws Exception {
		long value = -1;

		JSONObject json = getJson();
		if( JSONSupport.containsKey(json, key) ) {
			value = json.getLong(key);
		}
		
		return value;
	}
	
	protected void setLongAttribute(String key, long value) throws Exception {
		if( value >= 0 ) {
			JSONObject json = getJson();
			json.put(key, value);
		}
	}

	protected int getIntAttribute(String key) throws Exception {
		int value = -1;

		JSONObject json = getJson();
		if( JSONSupport.containsKey(json, key) ) {
			value = json.getInt(key);
		}
		
		return value;
	}
	
	protected void setIntAttribute(String key, int value) throws Exception {
		if( value >= 0 ) {
			JSONObject json = getJson();
			json.put(key, value);
		}
	}
}
