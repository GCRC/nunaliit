package ca.carleton.gcrc.json.patcher;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

/**
 * Given two instances of JSONObject (o1 and o2), compute a patch (which is
 * stored in a JSONObject) so that once the patch is applied to the first object,
 * the result is equivalent to the second one.
 * 
 * To compute a patch: JSONPatcher.computePatch(JSONObject prev, JSONObject next)
 * 
 * To apply a patch: JSONPatcher.applyPatch(JSONObject prev, JSONObject patch)
 *
 * The patch contains only the delta between the two objects given during computation.
 * 
 * In the patch, all identifiers that start with an underscore (_) are escaped with an
 * extra underscore. The identifier "_r" is reserved for removals or for a change in
 * size of an array. Indices are also escaped. Therefore, 0 is _0, 1 is _1, and so on.
 * 
 * 
 */
public class JSONPatcher {
	static public JSONObject computePatch(JSONObject prev, JSONObject next) throws Exception {
		Object patch = computePatchFromObjects(prev, next);
		if( null == patch ){
			return null;
		}
		
		if( false == (patch instanceof JSONObject) ){
			throw new Exception("Unexpected patch type");
		}
		
		return (JSONObject)patch;
	}
	
	static private Object computePatchFromObjects(Object prev, Object next) throws Exception {
		
		if( null == prev ) {
			throw new Exception("In computing patch, 'previous' should not be null");
		}
		if( null == next ) {
			throw new Exception("In computing patch, 'next' should not be null");
		}
		
		// Handle arrays
		if( next instanceof JSONArray
		 && prev instanceof JSONArray ){
			JSONArray nextArray = (JSONArray) next;
			JSONArray prevArray = (JSONArray) prev;

			JSONObject patch = null;
			JSONArray deletedKeys = null;
			
			if( nextArray.length() != prevArray.length() ){
				patch = new JSONObject();
				patch.put("_s", nextArray.length());
			}
			
			for(int i=nextArray.length()-1; i>=0; --i){
				Object nextElem = nextArray.get(i);
				Object prevElem = null;
				if( prevArray.length() > i ){
					prevElem = prevArray.get(i);
				}

				boolean shouldBeDeleted = false;
				boolean shouldBeReplaced = false;
				Object subPatch = null;
				if( null == nextElem ){
					// deleted
					shouldBeDeleted = true;

				} else if( null == prevElem ) {
					// new element
					shouldBeReplaced = true;

				} else if( nextElem instanceof JSONObject
				 && prevElem instanceof JSONArray ) {
					// Change in type. Delete before cloning
					shouldBeDeleted = true;
					shouldBeReplaced = true;
					
				} else if( nextElem instanceof JSONArray
				 && prevElem instanceof JSONObject ) {
					// Change in type. Delete before cloning
					shouldBeDeleted = true;
					shouldBeReplaced = true;

				} else {
					subPatch = computePatchFromObjects(prevElem, nextElem);
				}
				
				if( shouldBeDeleted 
				 || shouldBeReplaced
				 || null != subPatch ){
					if( null == patch ){
						patch = new JSONObject();
					}
				}
				
				if( shouldBeDeleted ) {
					if( null == deletedKeys ) {
						deletedKeys = new JSONArray();
						patch.put("_r", deletedKeys);
					}
					deletedKeys.put("_"+i);
				}
				
				if( null != subPatch ) {
					patch.put("_"+i, subPatch);
					
				} else if( shouldBeReplaced ) {
					if( nextElem instanceof JSONObject ){
						JSONObject c = JSONSupport.copyObject((JSONObject)nextElem);
						patch.put("_"+i, c);
						
					} else if( nextElem instanceof JSONArray ){
						JSONArray c = JSONSupport.copyArray((JSONArray)nextElem);
						patch.put("_"+i, c);

					} else {
						patch.put("_"+i, nextElem);
					}
				}
			}
			
			return patch;
			
		} if( next instanceof JSONObject
		 && prev instanceof JSONObject ) {
			JSONObject nextObject = (JSONObject)next;
			JSONObject prevObject = (JSONObject)prev;
			
			// Accumulate key names
			Set<String> keys = new HashSet<String>();
			{
				Iterator<?> it = nextObject.keys();
				while( it.hasNext() ){
					Object keyObj = it.next();
					if( keyObj instanceof String ){
						String key = (String)keyObj;
						keys.add(key);
					}
				}
			}
			{
				Iterator<?> it = prevObject.keys();
				while( it.hasNext() ){
					Object keyObj = it.next();
					if( keyObj instanceof String ){
						String key = (String)keyObj;
						keys.add(key);
					}
				}
			}
			
			// Iterate over keys
			JSONObject patch = null;
			JSONArray deletedKeys = null;
			for(String key : keys){
				Object prevElem = prevObject.opt(key);
				Object nextElem = nextObject.opt(key);
				
				boolean shouldBeDeleted = false;
				boolean shouldBeReplaced = false;
				Object subPatch = null;
				if( null == nextElem ){
					// deleted
					shouldBeDeleted = true;

				} else if( null == prevElem ) {
					// new element
					shouldBeReplaced = true;

				} else if( nextElem instanceof JSONObject
				 && prevElem instanceof JSONArray ) {
					// Change in type. Delete before cloning
					shouldBeDeleted = true;
					shouldBeReplaced = true;
					
				} else if( nextElem instanceof JSONArray
				 && prevElem instanceof JSONObject ) {
					// Change in type. Delete before cloning
					shouldBeDeleted = true;
					shouldBeReplaced = true;

				} else {
					subPatch = computePatchFromObjects(prevElem, nextElem);
				}
				
				if( shouldBeDeleted 
				 || shouldBeReplaced
				 || null != subPatch ){
					if( null == patch ){
						patch = new JSONObject();
					}
				}
				
				if( shouldBeDeleted ) {
					if( null == deletedKeys ) {
						deletedKeys = new JSONArray();
						patch.put("_r", deletedKeys);
					}
					deletedKeys.put(key);
				}
				
				if( null != subPatch ) {
					String effectiveKey = key;
					if( key.length() > 0 && key.charAt(0) == '_' ){
						effectiveKey = "_" + key;
					}
					patch.put(effectiveKey, subPatch);
					
				} else if( shouldBeReplaced ) {
					String effectiveKey = key;
					if( key.length() > 0 && key.charAt(0) == '_' ){
						effectiveKey = "_" + key;
					}

					if( nextElem instanceof JSONObject ){
						JSONObject c = JSONSupport.copyObject((JSONObject)nextElem);
						patch.put(effectiveKey, c);
						
					} else if( nextElem instanceof JSONArray ){
						JSONArray c = JSONSupport.copyArray((JSONArray)nextElem);
						patch.put(effectiveKey, c);

					} else {
						patch.put(effectiveKey, nextElem);
					}
				}
			}
			
			return patch;
			
		} else if( next instanceof JSONObject ) {
			// Replace with clone
			JSONObject nextObj = (JSONObject)next;
			return JSONSupport.copyObject(nextObj);
			
		} else if( next instanceof JSONArray ) {
			// Replace with clone
			JSONArray nextArr = (JSONArray)next;
			return JSONSupport.copyArray(nextArr);
			
		} else if( false == next.equals(prev) ) {
			return next;
			
			
		} else {
			return null;
		}
	}
	
	static public void applyPatch(JSONObject obj, JSONObject patch) throws Exception {
		applyPatchToObject(obj, patch);
	}
	
	static private void applyPatchToObject(Object obj, JSONObject patch) throws Exception {
		if( null == patch ){
			return;
		}

		// Deal with change in size
		Object sObj = patch.opt("_s");
		if( null != sObj ){
			if( obj instanceof JSONArray ) {
				JSONArray arr = (JSONArray)obj;
				
				if( sObj instanceof Integer ) {
					// Change in size
					Integer newArraySize = (Integer)sObj;
					if( newArraySize < 0 ){
						throw new Exception("The _s attribute should specify a non-negative integer");
					}
					
					while( arr.length() > newArraySize ){
						arr.remove( arr.length() - 1 );
					}
					while( arr.length() < newArraySize ){
						arr.put( (JSONObject)null );
					}
				} else {
					throw new Exception("The _s attribute should specify an integer");
				}
			}
		}
		
		// Deal with removals
		Object rObj = patch.opt("_r");
		if( null != rObj ){
			if( obj instanceof JSONArray ) {
				JSONArray arr = (JSONArray)obj;
				
				if( rObj instanceof JSONArray ) {
					// Remove elements
					JSONArray rArr = (JSONArray)rObj;
					for(int i=0,e=rArr.length(); i<e; ++i){
						Object keyObj = rArr.get(i);
						if( keyObj instanceof String ){
							String key = (String)keyObj;
							if( key.length() > 1 
							 && key.charAt(0) == '_' ) {
								int index = Integer.parseInt(key.substring(1));
								arr.put(index, JSONObject.NULL);
								
							} else {
								throw new Exception("For an array, the _r attribute should specify an array of strings which are indices");
							}
						} else {
							throw new Exception("For an array, the _r attribute should specify an array of strings");
						}
					}

				} else {
					throw new Exception("For an array, the _r attribute should specify an array");
				}
				
			} else if( obj instanceof JSONObject ) {
				JSONObject jsonObj = (JSONObject)obj;
				
				if( rObj instanceof JSONArray ) {
					// Remove elements
					JSONArray rArr = (JSONArray)rObj;
					for(int i=0,e=rArr.length(); i<e; ++i){
						Object keyObj = rArr.get(i);
						if( keyObj instanceof String ){
							String key = (String)keyObj;
							jsonObj.remove(key);
						} else {
							throw new Exception("For an object, the _r attribute should specify an array of strings");
						}
					}
					
				} else {
					throw new Exception("For an object, the _r attribute should specify an array");
				}
				
			} else {
				throw new Exception("Unexpected object type to apply patch: "+obj.getClass().getName());
			}
		}
		
		// Apply patch
		Iterator<?> keyIt = patch.keys();
		while( keyIt.hasNext() ){
			Object keyObj = keyIt.next();
			if( keyObj instanceof String ){
				String key = (String)keyObj;
				
				if( key.equals("_r") ) {
					// Ignore
					
				} else if( key.equals("_s") ) {
					// Ignore
					
				} else if( key.length() > 1 
				 && key.charAt(0) == '_' 
				 && key.charAt(1) == '_' ) {
					// Escaped key
					String effectiveKey = key.substring(1);
					applyStringAttributePatch(obj, effectiveKey, patch, key);
					
				} else if( key.length() > 1 
				 && key.charAt(0) == '_' ){
					// Escaped index
					int index = Integer.parseInt( key.substring(1) );
					applyIntegerAttributePatch(obj, index, patch, key);
					
				} else {
					applyStringAttributePatch(obj, key, patch, key);
				}
			}
		}
	}

	static private void applyStringAttributePatch(Object obj, String objKey, JSONObject patch, String patchKey) throws Exception {
		Object patchValue = patch.get(patchKey);

		if( obj instanceof JSONObject ){
			JSONObject jsonObj = (JSONObject)obj;
			Object currentValue = jsonObj.opt(objKey);
			if( null == currentValue ){
				// Clone
				if( patchValue instanceof JSONObject ) {
					JSONObject clone = JSONSupport.copyObject((JSONObject)patchValue);
					jsonObj.put(objKey, clone);
					
				} else if( patchValue instanceof JSONArray ){
					JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
					jsonObj.put(objKey, clone);
					
				} else {
					jsonObj.put(objKey, patchValue);
				}
				
			} else if( currentValue instanceof JSONArray 
			 && patchValue instanceof JSONObject ){
				// patch
				applyPatchToObject(currentValue, (JSONObject)patchValue);
				
			} else if( currentValue instanceof JSONArray 
			 && patchValue instanceof JSONArray ){
				// replace
				JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
				jsonObj.put(objKey, clone);
				
			} else if( currentValue instanceof JSONObject 
			 && patchValue instanceof JSONObject ){
				// patch
				applyPatchToObject(currentValue, (JSONObject)patchValue);
				
			} else if( currentValue instanceof JSONObject 
			 && patchValue instanceof JSONArray ){
				// replace
				JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
				jsonObj.put(objKey, clone);
				
			} else if( patchValue instanceof JSONObject ){
				// clone
				JSONObject clone = JSONSupport.copyObject((JSONObject)patchValue);
				jsonObj.put(objKey, clone);
				
			} else if( patchValue instanceof JSONArray ){
				// clone
				JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
				jsonObj.put(objKey, clone);
				
			} else {
				// replace
				jsonObj.put(objKey, patchValue);
			}
			
		} else {
			throw new Exception("String attributes can only be applied to objects");
		}
	}

	static private void applyIntegerAttributePatch(Object obj, int index, JSONObject patch, String patchKey) throws Exception {
		Object patchValue = patch.get(patchKey);

		if( obj instanceof JSONArray ){
			JSONArray jsonArr = (JSONArray)obj;
			Object currentValue = jsonArr.opt(index);
			if( null == currentValue ){
				// Clone
				if( patchValue instanceof JSONObject ) {
					JSONObject clone = JSONSupport.copyObject((JSONObject)patchValue);
					jsonArr.put(index, clone);
					
				} else if( patchValue instanceof JSONArray ){
					JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
					jsonArr.put(index, clone);
					
				} else {
					jsonArr.put(index, patchValue);
				}
				
			} else if( currentValue instanceof JSONArray 
			 && patchValue instanceof JSONObject ){
				// patch
				applyPatchToObject(currentValue, (JSONObject)patchValue);
				
			} else if( currentValue instanceof JSONArray 
			 && patchValue instanceof JSONArray ){
				// replace
				JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
				jsonArr.put(index, clone);
				
			} else if( currentValue instanceof JSONObject 
			 && patchValue instanceof JSONObject ){
				// patch
				applyPatchToObject(currentValue, (JSONObject)patchValue);
				
			} else if( currentValue instanceof JSONObject 
			 && patchValue instanceof JSONArray ){
				// replace
				JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
				jsonArr.put(index, clone);
				
			} else if( patchValue instanceof JSONObject ){
				// clone
				JSONObject clone = JSONSupport.copyObject((JSONObject)patchValue);
				jsonArr.put(index, clone);
				
			} else if( patchValue instanceof JSONArray ){
				// clone
				JSONArray clone = JSONSupport.copyArray((JSONArray)patchValue);
				jsonArr.put(index, clone);
				
			} else {
				// replace
				jsonArr.put(index, patchValue);
			}
			
		} else {
			throw new Exception("Index attributes can only be applied to arrays");
		}
	}
}

