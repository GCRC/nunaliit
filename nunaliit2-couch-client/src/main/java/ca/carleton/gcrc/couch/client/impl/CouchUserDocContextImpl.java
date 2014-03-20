package ca.carleton.gcrc.couch.client.impl;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchUserDocContext;

public class CouchUserDocContextImpl implements CouchUserDocContext {

	private JSONObject userDoc;
	
	public CouchUserDocContextImpl(JSONObject userDoc){
		this.userDoc = userDoc;
	}
	
	@Override
	public String getName() {
		String name = userDoc.optString("name");
		return name;
	}

	@Override
	public List<String> getRoles() {
		JSONArray rolesArr = userDoc.optJSONArray("roles");
		if( null == rolesArr ){
			return new ArrayList<String>(0);
		}
		
		List<String> roles = new ArrayList<String>( rolesArr.length() );
		for(int i=0,e=rolesArr.length(); i<e; ++i){
			String role = rolesArr.optString(i);
			if( null != role ) {
				roles.add( role );
			}
		}
		return roles;
	}

	@Override
	public JSONObject getUserDoc() {
		return userDoc;
	}

}
