package ca.carleton.gcrc.couch.utils;

import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import org.json.JSONObject;
import ca.carleton.gcrc.couch.client.CouchUserContext;


public class CouchNunaliitUtils {

	static public void adjustDocumentForStorage(
			JSONObject doc
			,CouchUserContext userContext
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
	
	static public boolean hasAdministratorRole(CouchUserContext userContext, String atlasName){
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
	
	static public boolean hasVetterRole(CouchUserContext userContext, String atlasName){
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
}
