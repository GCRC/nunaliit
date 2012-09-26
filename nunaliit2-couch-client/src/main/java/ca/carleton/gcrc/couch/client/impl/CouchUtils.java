package ca.carleton.gcrc.couch.client.impl;

import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.json.JSONSupport;

public class CouchUtils {
	
	static final public String HTTP_PROTOCOL = "http://";
	static final public String HTTPS_PROTOCOL = "https://";

	static public String computeEffectiveServerUrl(
			String serverUrl
			,String userName
			,String password
		) throws Exception {
		
		if( null == userName && null != password ) {
			throw new Exception("Can not specify a password without a user name");
		}
		if( null != userName && null == password ) {
			throw new Exception("Can not specify a user name without a password");
		}
		if( null != userName && null == serverUrl ) {
			throw new Exception("Can not specify a user name/password without a server URL");
		}
		if( null == serverUrl ) {
			return "";
		}
		
		String serverUrlWithoutProtocol = null;
		String protocol = null;
		if( serverUrl.startsWith(HTTP_PROTOCOL) ) {
			protocol = HTTP_PROTOCOL;
			serverUrlWithoutProtocol = serverUrl.substring(HTTP_PROTOCOL.length());
			
		} else if( serverUrl.startsWith(HTTPS_PROTOCOL) ) {
			protocol = HTTPS_PROTOCOL;
			serverUrlWithoutProtocol = serverUrl.substring(HTTPS_PROTOCOL.length());
			
		} else {
			throw new Exception("Server URL must specify a protocol (http:// or https://)");
		}
		
		if( null != userName ) {
			serverUrl = protocol + userName + ":" + password + "@" + serverUrlWithoutProtocol;
		}
		
		return serverUrl;
	}

	static public String computeEffectiveDatabaseUrl(
			String serverUrl
			,String userName
			,String password
			,String databaseName
		) throws Exception {
		
		if( null == databaseName ) {
			throw new Exception("Can not specify a db URL without a database name");
		}
		
		String effectiveServerUrl = computeEffectiveServerUrl(serverUrl, userName, password);
		if( "".equals(effectiveServerUrl) ) {
			return databaseName;
		}

		if( effectiveServerUrl.endsWith("/") ) {
			return effectiveServerUrl + databaseName;
		}
		
		return effectiveServerUrl + "/" + databaseName;
	}
	
	static CouchUserContext userContextFromDocument(JSONObject userDoc) throws Exception {

		String name = null;
		List<String> roles = new Vector<String>();
		try {
			if( JSONSupport.containsKey(userDoc, "name") ) {
				name = userDoc.getString("name");
			}
			if( JSONSupport.containsKey(userDoc, "roles") ) {
				JSONArray roleArray = userDoc.getJSONArray("roles");
				for(int i=0,e=roleArray.length(); i<e; ++i){
					Object roleObj = roleArray.get(i);
					if( roleObj instanceof String ){
						roles.add( (String)roleObj );
					}
				}
			}
		} catch(Exception e) {
			throw new Exception("Error parsing user document",e);
		}
		
		CouchUserContext userCtx = new CouchUserContext();
		userCtx.setName(name);
		userCtx.setRoles(roles);
		
		return userCtx;
	}
}
