package ca.carleton.gcrc.couch.client.impl;

import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.json.JSONSupport;

public class CouchSessionImpl implements CouchSession {

	private CouchClient client;
	private URL url;

	public CouchSessionImpl(CouchClient client, URL url){
		this.client = client;
		this.url = url;
	}
	
	@Override
	public CouchContext getContext() {
		return client.getContext();
	}

	@Override
	public CouchClient getClient() {
		return client;
	}

	@Override
	public URL getUrl() {
		return url;
	}

	@Override
	public CouchAuthenticationContext getAuthenticationContext() throws Exception {

		// GET _session
		JSONObject response = ConnectionUtils.getJsonResource(getContext(), url);
		
		ConnectionUtils.captureReponseErrors(response, "Error while obtaining session context: ");
		
		// Parse response
		String name = null;
		List<String> roles = new Vector<String>();
		try {
			JSONObject jsonUserCtx = response.getJSONObject("userCtx");
			if( JSONSupport.containsKey(jsonUserCtx, "name") ) {
				name = jsonUserCtx.optString("name", null);
			}
			if( JSONSupport.containsKey(jsonUserCtx, "roles") ) {
				JSONArray roleArray = jsonUserCtx.getJSONArray("roles");
				for(int i=0,e=roleArray.length(); i<e; ++i){
					Object roleObj = roleArray.get(i);
					if( roleObj instanceof String ){
						roles.add( (String)roleObj );
					}
				}
			}
		} catch(Exception e) {
			throw new Exception("Error parsing session context response",e);
		}
		
		CouchAuthenticationContextImpl authCtx = new CouchAuthenticationContextImpl();
		authCtx.setName(name);
		authCtx.setRoles(roles);
		
		return authCtx;
	}

	@Override
	public CouchContext createSession(String userName, String password) throws Exception {
		
		Map<String,String> form = new HashMap<String,String>();
		form.put("name", userName);
		form.put("password", password);
		
		// Create a context to receive the cookie for authentication
		CouchContextCookie context = new CouchContextCookie();
		
		// POST _session
		JSONObject jsonUserCtx = ConnectionUtils.postForm(context, url, form);
		
		ConnectionUtils.captureReponseErrors(jsonUserCtx, "Error while creating session context: ");
		
		// Parse response
		CouchUtils.authenticationContextFromDocument(jsonUserCtx);
		
		return context;
	}

}
