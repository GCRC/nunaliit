package ca.carleton.gcrc.couch.client.impl;

import java.net.HttpURLConnection;

import ca.carleton.gcrc.couch.client.CouchContext;

public abstract class CouchContextBase implements CouchContext {

	static public CouchContextBase getBase(CouchContext context) throws Exception {
		if( context instanceof CouchContextBase ) {
			return (CouchContextBase)context;
		}
		throw new Exception("Does not implement CouchContextBase: "+context.getClass().getName());
	}
	
	abstract public void adjustConnection(HttpURLConnection conn) throws Exception;
}
