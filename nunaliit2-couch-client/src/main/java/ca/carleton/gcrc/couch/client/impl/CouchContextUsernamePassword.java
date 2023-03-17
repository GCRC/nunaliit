package ca.carleton.gcrc.couch.client.impl;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;

import org.apache.commons.codec.binary.Base64;

public class CouchContextUsernamePassword extends CouchContextBase {

	private String username;
	private char[] password;
	private String value = null;
	
	public CouchContextUsernamePassword(String username, char[] password) {
		this.username = username;
		this.password = password;
	}

	@Override
	public void adjustConnection(HttpURLConnection conn) throws Exception {
		
		String v = null;
		synchronized(this) {
			if( null == value ) {
				byte[] encoded = null;
				try(
					ByteArrayOutputStream baos = new ByteArrayOutputStream();
					OutputStreamWriter osw = new OutputStreamWriter(baos, "UTF-8");
					) {
					osw.write(username);
					osw.write(":");
					osw.write(password);
					osw.flush();
					encoded = Base64.encodeBase64(baos.toByteArray());
				}
				
				try(
					ByteArrayInputStream bais = new ByteArrayInputStream(encoded);
					InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
					BufferedReader br = new BufferedReader(isr);
				) {
					value = "Basic " + br.readLine();
				}
			}
			
			v = value;
		}
		
		conn.setRequestProperty("Authorization", v);
	}

}
