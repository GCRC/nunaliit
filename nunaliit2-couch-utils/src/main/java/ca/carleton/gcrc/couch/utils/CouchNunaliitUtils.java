package ca.carleton.gcrc.couch.utils;

import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;


public class CouchNunaliitUtils {
	
	static final protected Logger logger = LoggerFactory.getLogger(CouchNunaliitUtils.class);

	static public void adjustDocumentForStorage(
			JSONObject doc
			,CouchAuthenticationContext userContext
		) throws Exception {
	
		long now = (new Date()).getTime();

		// nunaliit_created
		if( null != userContext ){
			JSONObject created = doc.optJSONObject(CouchNunaliitConstants.DOC_KEY_CREATED);
			if( null == created ) {
				created = new JSONObject();
				created.put("time", now);
				created.put(
					CouchNunaliitConstants.DOC_KEY_TYPE
					,CouchNunaliitConstants.TYPE_ACTION_STAMP
					);
				created.put("name", userContext.getName());
				created.put("action", "created");
				doc.put(CouchNunaliitConstants.DOC_KEY_CREATED, created);
			}
		}

		// nunaliit_last_updated
		if( null != userContext ){
			JSONObject updated = new JSONObject();
			updated.put("time", now);
			updated.put(
				CouchNunaliitConstants.DOC_KEY_TYPE
				,CouchNunaliitConstants.TYPE_ACTION_STAMP
				);
			updated.put("name", userContext.getName());
			updated.put("action", "updated");
			doc.put(CouchNunaliitConstants.DOC_KEY_LAST_UPDATED, updated);
		}
	}
	
	static public boolean hasAdministratorRole(CouchAuthenticationContext userContext, String atlasName){
		if( null == userContext ) {
			return false;
		}
		
		Collection<String> roles = userContext.getRoles();
		if( null == roles ) {
			return false;
		}
		
		// Figure out acceptable administrator roles
		Set<String> adminRoles = new HashSet<String>();
		adminRoles.add("_admin");
		adminRoles.add("administrator");
		if( null != atlasName ) {
			adminRoles.add(atlasName + "_administrator");
		}
		
		for(String role : roles){
			if( adminRoles.contains(role) ) {
				return true;
			}
		}
		
		return false;
	}
	
	static public boolean hasVetterRole(CouchAuthenticationContext userContext, String atlasName){
		if( null == userContext ) {
			return false;
		}
		
		Collection<String> roles = userContext.getRoles();
		if( null == roles ) {
			return false;
		}
		
		// Figure out acceptable vetter roles
		Set<String> vetterRoles = new HashSet<String>();
		vetterRoles.add("vetter");
		if( null != atlasName ) {
			vetterRoles.add(atlasName + "_vetter");
		}
		
		for(String role : roles){
			if( vetterRoles.contains(role) ) {
				return true;
			}
		}
		
		// Administrators are automatically vetters
		return hasAdministratorRole(userContext, atlasName);
	}
	
	static public List<JSONObject> findStructuresOfType(String type, JSONObject doc){
		List<JSONObject> structures = new Vector<JSONObject>();
		
		findStructuresOfType(doc, type, structures);
		
		return structures;
	}
	
	static private void findStructuresOfType(Object obj, String type, List<JSONObject> structures){
		if( obj instanceof JSONObject ){
			JSONObject jsonObj = (JSONObject)obj;
			
			String nunaliitType = jsonObj.optString("nunaliit_type");
			if( null != nunaliitType && nunaliitType.equals(type) ){
				structures.add(jsonObj);
			}
			
			// Iterate over children structures
			Iterator<?> it = jsonObj.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = jsonObj.opt(key);
					if( null != value ){
						findStructuresOfType(value, type, structures);
					}
				}
			}
		} else if( obj instanceof JSONArray ) {
			JSONArray jsonArr = (JSONArray)obj;
			
			// Iterate over children values
			for(int i=0,e=jsonArr.length(); i<e; ++i){
				Object value = jsonArr.opt(i);
				if( null != value ){
					findStructuresOfType(value, type, structures);
				}
			};
		}
	}
}
