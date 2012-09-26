package ca.carleton.gcrc.couch.client.impl;

import java.net.HttpURLConnection;

public class CouchContextNull extends CouchContextBase {

	@Override
	public void adjustConnection(HttpURLConnection conn) {
		// Nothing to do
	}

}
