package ca.carleton.gcrc.couch.client.impl;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.net.URL;
import java.security.MessageDigest;
import java.security.SecureRandom;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.CouchUserDocContext;
import ca.carleton.gcrc.security.rng.RngFactory;

public class CouchUserDbImpl extends CouchDbImpl implements CouchUserDb {

	public CouchUserDbImpl(CouchClient client, URL url) {
		super(client, url);
	}
	
	@Override
	public CouchUserDocContext getUserFromName(String userName) throws Exception {
		try{
			JSONObject userDoc = getDocument("org.couchdb.user:"+userName);
			
			CouchUserDocContextImpl userCtx = new CouchUserDocContextImpl(userDoc);
			
			return userCtx;
			
		} catch(Exception e) {
			throw new Exception("Error obtaining document for user: "+userName);
		}
	}

	@Override
	public void computeUserPassword(JSONObject userDoc, String password) throws Exception {
		String version = this.getClient().getVersion().getFullVersion();
		
		if( version.compareTo("1.3") < 0 ){
			// Prior to 1.3.0. Use salt and password_sha
			
			SecureRandom rng = (new RngFactory()).createRng();
			byte[] salt = new byte[16];
			rng.nextBytes(salt);
			
			String saltString = null;
			{
				StringWriter sw = new StringWriter();
				for(byte b : salt){
					sw.write(String.format("%02x", b));
				}
				saltString = sw.toString();
			}
			
			String password_sha = null;
			{
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(baos);
				osw.write(password);
				osw.write(saltString);
				osw.flush();
				
				MessageDigest md = MessageDigest.getInstance("SHA-1");
				byte[] digest = md.digest(baos.toByteArray());
				
				StringWriter sw = new StringWriter();
				for(byte b : digest){
					sw.write(String.format("%02x", b));
				}
				password_sha = sw.toString();
			}
			
			userDoc.put("salt", saltString);
			userDoc.put("password_sha", password_sha);
			
			if( userDoc.opt("password") != null ) {
				userDoc.remove("password");
			}
			if( userDoc.opt("password_scheme") != null ) {
				userDoc.remove("password_scheme");
			}
			if( userDoc.opt("iterations") != null ) {
				userDoc.remove("iterations");
			}
			if( userDoc.opt("derived_key") != null ) {
				userDoc.remove("derived_key");
			}
			
		} else {
			// After 1.3.0, simply set the "password" attribute. The
			// database performs the work.
			userDoc.put("password", password);
			
			if( userDoc.opt("password_scheme") != null ) {
				userDoc.remove("password_scheme");
			}
			if( userDoc.opt("iterations") != null ) {
				userDoc.remove("iterations");
			}
			if( userDoc.opt("derived_key") != null ) {
				userDoc.remove("derived_key");
			}
			if( userDoc.opt("salt") != null ) {
				userDoc.remove("salt");
			}
			if( userDoc.opt("password_sha") != null ) {
				userDoc.remove("password_sha");
			}
		}
	}

}
