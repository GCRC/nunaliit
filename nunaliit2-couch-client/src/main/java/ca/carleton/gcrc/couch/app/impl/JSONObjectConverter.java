package ca.carleton.gcrc.couch.app.impl;

import java.util.HashSet;
import java.util.Set;

import org.json.JSONException;
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
		converter.addIgnoredKey(DocumentManifest.MANIFEST_KEY);
		return converter;
	}

	static public JSONObjectConverter getConverterNoTimestamps() {
		JSONObjectConverter converter = new JSONObjectConverter();
		converter.addIgnoredKey(DocumentManifest.MANIFEST_KEY);
		converter.addIgnoredKey("nunaliit_created");
		converter.addIgnoredKey("nunaliit_last_updated");
		return converter;
	}

	private Set<String> ignoredKeys = new HashSet<String>();
	
	public Set<String> getIgnoredKeys() {
		return ignoredKeys;
	}

	public void addIgnoredKey(String ignoredKey) {
		this.ignoredKeys.add(ignoredKey);
	}

	public JSONObject convertObject(JSONObject obj) throws Exception {
		JSONObject convertedObj = new JSONObject();

		for(String name : JSONObject.getNames(obj)){
			if( name.charAt(0) == '_' ) {
				// Do not include special keys in signature
			} else if( ignoredKeys.contains(name) ){
				// Skip this key
			} else {
				try {
					Object value = obj.get(name);
					convertedObj.put(name, value);
				} catch (JSONException e) {
					// Ignore;
				}
			}
		}
		
		return convertedObj;
	}
}
