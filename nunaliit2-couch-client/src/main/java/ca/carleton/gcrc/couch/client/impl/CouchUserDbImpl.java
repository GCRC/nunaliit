package ca.carleton.gcrc.couch.client.impl;

import java.net.URL;

import org.json.JSONObject;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.couch.client.CouchUserDb;

public class CouchUserDbImpl extends CouchDbImpl implements CouchUserDb {

	public CouchUserDbImpl(CouchClient client, URL url) {
		super(client, url);
	}
	
	@Override
	public CouchUserContext getUserFromName(String userName) throws Exception {
		try{
			JSONObject userDoc = getDocument("org.couchdb.user:"+userName);
			
			CouchUserContext userCtx = CouchUtils.userContextFromDocument(userDoc);
			
			return userCtx;
			
		} catch(Exception e) {
			throw new Exception("Error obtaining document for user: "+userName);
		}
	}

}
