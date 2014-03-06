package ca.carleton.gcrc.json.patcher;

import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONObject;

public class JSONPatcher {
	static public JSONObject computePatch(JSONObject prev, JSONObject next) throws Exception {
		Object patch = computePatch(prev, next);
		if( null == patch ){
			return null;
		}
		
		if( false == (patch instanceof JSONObject) ){
			throw new Exception("Unexpected patch type");
		}
		
		return (JSONObject)patch;
	}
	
	static public Object computePatch(Object prev, Object next) throws Exception {
		
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
					Object nextElem = nextArray.get(i);
					Object prevElem = null;
					if( prevArray.length() > i ){
						prevElem = prevArray.get(i);
					}
					boolean sub = processElement(patch, ""+i, prevElem, nextElem);
					if( sub ){
						hasUpdates = true;
					}
				}
			} else {
				// must become an array
				hasUpdates = true;
				patch.put("_t", "array");
				patch.put("_r", nextArray.length());
				for(int i=nextArray.length()-1; i>=0; --i){
					Object nextElem = nextArray.get(i);
					addToPatch(patch, ""+i, nextElem);
				}
			}
			
		} if( next instanceof JSONObject ) {
			JSONObject nextObject = (JSONObject)next;
			if( prev instanceof JSONObject ) {
				JSONObject prevObject = (JSONObject)prev;
				
				// Process addition and updates
				Iterator<?> it = nextObject.keys();
				while( it.hasNext() ){
					Object nameObj = it.next();
					if( nameObj instanceof String ){
						String name = (String)nameObj;
						
						Object nextElem = nextObject.get(name);
						Object prevElem = prevObject.opt(name);
						boolean sub = processElement(patch, name, prevElem, nextElem);
						if( sub ){
							hasUpdates = true;
						}
					}
				}
				
				// Process deletion
				{
					it = prevObject.keys();
					JSONArray deletedKeys = null;
					while( it.hasNext() ){
						Object nameObj = it.next();
						if( nameObj instanceof String ){
							String name = (String)nameObj;
							
							Object nextElem = nextObject.get(name);
							if( null == nextElem ){
								// deleted
								if( null == deletedKeys ) {
									deletedKeys = new JSONArray();
								}
								deletedKeys.put(name);
							}
						}
					}
					
					if( null != deletedKeys ){
						hasUpdates = true;
						patch.put("_r", deletedKeys);
					}
				}
				
			} else {
				// must become an object
				hasUpdates = true;
				patch.put("_t", "object");
				Iterator<?> it = nextObject.keys();
				while( it.hasNext() ){
					Object nameObj = it.next();
					if( nameObj instanceof String ){
						String name = (String)nameObj;
						
						Object nextElem = nextObject.get(name);
						addToPatch(patch, name, nextElem);
					}
				}
			}
			
		} else if( next instanceof Boolean ) {
			Boolean nextBoolean = (Boolean)next;
			if( prev instanceof Boolean ){
				Boolean prevBoolean = (Boolean)prev;
				if( prevBoolean != nextBoolean ){
					return nextBoolean;
				} else {
					return null;
				}
			} else {
				return nextBoolean;
			}
			
		} else if( next instanceof String ) {
			String nextString = (String)next;
			if( prev instanceof String ){
				String prevString = (String)prev;
				if( false == prevString.equals(nextString) ){
					return nextString;
				} else {
					return null;
				}
			} else {
				return nextString;
			}
			
		} else if( next instanceof Number ) {
			Number nextNumber = (Number)next;
			if( prev instanceof Number ){
				Number prevNumber = (Number)prev;
				if( false == prevNumber.equals(nextNumber) ){
					return nextNumber;
				} else {
					return null;
				}
			} else {
				return nextNumber;
			}
			
		}
		
		if( false == hasUpdates ){
			patch = null;
		}
		return patch;
	}
	
	static private boolean processElement(
		JSONObject patch
		,String id
		,Object prev
		,Object next) throws Exception {
		
		if( prev == next ){
			// nothing to do
			return false;
		}
		
		Object subPatch = computePatch(prev, next);
		if( null != subPatch ){
			addToPatch(patch, id, subPatch);
			return true;
		}
		
		return false;
	}
	
	static private void addToPatch(JSONObject patch, String id, Object obj) throws Exception {
		String effectiveId = id;
		if( effectiveId.charAt(0) == '_' ){
			effectiveId = "_" + id;
		}
		patch.put(effectiveId, obj);
	}
}

