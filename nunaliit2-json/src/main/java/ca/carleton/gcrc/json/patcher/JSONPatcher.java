package ca.carleton.gcrc.json.patcher;

import org.json.JSONArray;
import org.json.JSONObject;

public class JSONPatcher {
	static public JSONObject computePatch(Object prev, Object next) throws Exception {
		
		JSONObject patch = new JSONObject();
		boolean hasUpdates = false;
		
		// Handle arrays
		if( next instanceof JSONArray ){
			JSONArray nextArray = (JSONArray) next;
			if( prev instanceof JSONArray ){
				JSONArray prevArray = (JSONArray) prev;
				if( nextArray.length() != prevArray.length() ){
					hasUpdates = true;
					patch.put("_r", nextArray.length());
				}
				for(int i=nextArray.length()-1; i>=0; --i){
//					Object 
//					processElement(patch, ""+i, );
				}
			} else {
				// must become an array
			}
		}
		
		if( false == hasUpdates ){
			patch = null;
		}
		return patch;
	}
}

