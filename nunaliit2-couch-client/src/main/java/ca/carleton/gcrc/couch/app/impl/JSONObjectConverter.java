package ca.carleton.gcrc.couch.app.impl;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Create a JSONObject from a source JSONObject. The new JSONObject contains
 * only the top keys that are necessary for certain operations.
 */
public class JSONObjectConverter {
	
	static public JSONObjectConverter getConverterCouchDb() {
		return new JSONObjectConverter();
	}

	static public JSONObjectConverter getConverterNunaliit() {
		JSONObjectConverter converter = new JSONObjectConverter();
		converter.setIgnoreSpecialKeys(true);
		converter.addIgnoredKey(DocumentManifest.MANIFEST_KEY);
		converter.addIgnoredKeyByType("date", "index");
		return converter;
	}

	static public JSONObjectConverter getConverterNoTimestamps() {
		JSONObjectConverter converter = new JSONObjectConverter();
		converter.setIgnoreSpecialKeys(true);
		converter.addIgnoredKey(DocumentManifest.MANIFEST_KEY);
		converter.addIgnoredKeyByType("date", "index");
		converter.addIgnoredKey("nunaliit_created");
		converter.addIgnoredKey("nunaliit_last_updated");
		return converter;
	}

	static public JSONObjectConverter getUploadConverter() {
		JSONObjectConverter converter = new JSONObjectConverter();
		converter.addIgnoredKey(DocumentManifest.MANIFEST_KEY);
		converter.addIgnoredKeyByType("date", "index");
		return converter;
	}

	private boolean ignoreSpecialKeys = false;
	private Set<String> ignoredKeys = new HashSet<String>();
	private Map<String,Set<String>> ignoredKeysByType = new HashMap<String,Set<String>>();

	public boolean isIgnoreSpecialKeys() {
		return ignoreSpecialKeys;
	}

	public void setIgnoreSpecialKeys(boolean ignoreSpecialKeys) {
		this.ignoreSpecialKeys = ignoreSpecialKeys;
	}

	public Set<String> getIgnoredKeys() {
		return ignoredKeys;
	}

	public void addIgnoredKey(String ignoredKey) {
		this.ignoredKeys.add(ignoredKey);
	}

	public Set<String> getIgnoredKeysByType(String type) {
		return ignoredKeysByType.get(type);
	}

	public void addIgnoredKeyByType(String type, String ignoredKey) {
		Set<String> keys = ignoredKeysByType.get(type);
		if( null == keys ){
			keys = new HashSet<String>();
			ignoredKeysByType.put(type,keys);
		}
		keys.add(ignoredKey);
	}

	public JSONObject convertObject(JSONObject obj) throws Exception {
		return convert(obj, true);
	}

	private JSONObject convert(JSONObject obj, boolean topLevel) throws Exception {
		JSONObject convertedObj = new JSONObject();
		
		String type = obj.optString("nunaliit_type",null);
		Set<String> ignoredKeysForThisType = null;
		if( null != type ){
			ignoredKeysForThisType = ignoredKeysByType.get(type);
		}

		String[] names = JSONObject.getNames(obj);
		if( null != names ){
			for(String name : names){
				if( topLevel
				 && ignoreSpecialKeys 
				 && name.charAt(0) == '_' ) {
					// Do not include special keys

				} else if( topLevel
				 && ignoredKeys.contains(name) ){
					// Skip this key

				} else if( null != ignoredKeysForThisType 
				 && ignoredKeysForThisType.contains(name) ){
					// Skip this key based on type

				} else {
					// Copy over
					Object value = obj.get(name);
					if( value instanceof JSONObject ){
						JSONObject convertedValue = convert((JSONObject)value, false);
						convertedObj.put(name, convertedValue);

					} else if( value instanceof JSONArray ){
						JSONArray convertedValue = convert((JSONArray)value);
						convertedObj.put(name, convertedValue);

					} else {
						convertedObj.put(name, value);
					}
				}
			}
		}
		
		return convertedObj;
	}

	private JSONArray convert(JSONArray array) throws Exception {
		JSONArray convertedArray = new JSONArray();

		for(int i=0; i<array.length(); ++i){
			Object value = array.get(i);
			
			if( value instanceof JSONObject ){
				JSONObject convertedValue = convert((JSONObject)value, false);
				convertedArray.put(i, convertedValue);

			} else if( value instanceof JSONArray ){
				JSONArray convertedValue = convert((JSONArray)value);
				convertedArray.put(i, convertedValue);

			} else {
				convertedArray.put(i, value);
			}
		}
		
		return convertedArray;
	}
}
