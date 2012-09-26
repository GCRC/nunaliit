package ca.carleton.gcrc.couch.client.impl;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;

public class InputStreamWithConnection extends InputStreamWrapper {

	private HttpURLConnection conn;
	
	public InputStreamWithConnection(InputStream wrapped, HttpURLConnection conn) {
		super(wrapped);
		
		this.conn = conn;
	}

	@Override
	public void close() throws IOException {
		super.close();
		
		conn.disconnect();
	}
}
