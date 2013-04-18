package ca.carleton.gcrc.couch.user;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Formatter;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDb;

public class UserServletActions {

	private CouchDb userDb;
	private JSONObject cached_welcome = null;

	public UserServletActions(
			CouchDb userDb
		){
		this.userDb = userDb;
	}
	
	synchronized public JSONObject getWelcome() throws Exception{
		if( null == cached_welcome ){
			cached_welcome = new JSONObject();
			cached_welcome.put("UserServlet", true);
		}
		
		return cached_welcome;
	}

	public JSONObject getUser(String name) throws Exception {
		String id = "org.couchdb.user:"+name;
		JSONObject userDoc = userDb.getDocument(id);
		
		JSONObject result = getPublicUserFromUser(userDoc);
		
		return result;
	}

	public JSONObject getUsers(List<String> names) throws Exception {
		List<String> docIds = new ArrayList<String>(names.size());
		for(String n : names){
			String id = "org.couchdb.user:"+n;
			docIds.add(id);
		}
		
		Collection<JSONObject> userDocs = userDb.getDocuments(docIds);
		
		JSONObject result = new JSONObject();
		
		JSONArray userArray = new JSONArray();
		result.put("users", userArray);
		
		for(JSONObject userDoc : userDocs) {
			JSONObject pubUser = getPublicUserFromUser(userDoc);
			userArray.put(pubUser);
		}
		
		return result;
	}

	private JSONObject getPublicUserFromUser(JSONObject userDoc) throws Exception {
		JSONObject result = new JSONObject();
		
		result.put("_id", userDoc.opt("_id"));
		result.put("_rev", userDoc.opt("_rev"));
		result.put("name", userDoc.opt("name"));
		result.put("display", userDoc.opt("display"));
		
		JSONArray emailArray = userDoc.optJSONArray("nunaliit_emails");
		if( null != emailArray ){
			JSONArray emailDigest = new JSONArray();
			
			for(int i=0,e=emailArray.length();i<e;++i){
				Object emailObj = emailArray.get(i);
				if( emailObj instanceof String ){
					String email = (String)emailObj;
					
					ByteArrayOutputStream baos = new ByteArrayOutputStream();
					OutputStreamWriter osw = new OutputStreamWriter(baos,"UTF-8");
					osw.write(email);
					osw.flush();
					
					MessageDigest md = MessageDigest.getInstance("MD5");
					md.update(baos.toByteArray());
					byte[] digest = md.digest();

					StringBuilder sb = new StringBuilder(digest.length * 2);
					Formatter formatter = new Formatter(sb);
					for (byte b : digest) {
						formatter.format("%02x", b);  
					}
					formatter.close();
					emailDigest.put( sb.toString() );  
				}
			}
			
			result.put("emailDigests", emailDigest);
		}
		
		return result;
	}
}
