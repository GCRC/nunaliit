package ca.carleton.gcrc.couch.user;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Formatter;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.user.mail.UserMailNotification;

public class UserServletActions {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb userDb;
	private CouchDesignDocument nunaliitUserDesignDocument;
	private UserMailNotification userMailNotification;
	private JSONObject cached_welcome = null;

	public UserServletActions(
			CouchDb userDb
			,CouchDesignDocument nunaliitUserDesignDocument
			,UserMailNotification userMailNotification
		){
		this.userDb = userDb;
		this.nunaliitUserDesignDocument = nunaliitUserDesignDocument;
		this.userMailNotification = userMailNotification;
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
		
		// Work around for bug in CouchDb 1.4.0
		if( userDocs.size() > 0 ) {
			JSONObject firstUser = userDocs.iterator().next();
			Object returnedId = firstUser.opt("_id");
			if( null == returnedId ){
				// Perform request, one at a time
				List<JSONObject> tempUserDocs = new Vector<JSONObject>();
				for(String id : docIds){
					try {
						JSONObject userDoc = userDb.getDocument(id);
						if( null != userDoc ){
							tempUserDocs.add(userDoc);
						}
					} catch(Exception e) {
						// Ignore error. User is not in database
					}
				}
				
				// Continue with this list, instead
				userDocs = tempUserDocs;
			}
		}
		
		JSONObject result = new JSONObject();
		
		JSONArray userArray = new JSONArray();
		result.put("users", userArray);
		
		for(JSONObject userDoc : userDocs) {
			JSONObject pubUser = getPublicUserFromUser(userDoc);
			userArray.put(pubUser);
		}
		
		return result;
	}

	public JSONObject getUserFromEmailAddress(String emailAddress) throws Exception {
		try {
			CouchQuery query = new CouchQuery();
			query.setViewName("emails");
			query.setStartKey(emailAddress);
			query.setEndKey(emailAddress);
			query.setIncludeDocs(true);

			CouchQueryResults results = nunaliitUserDesignDocument.performQuery(query);
			List<JSONObject> rows = results.getRows();
			for(JSONObject row : rows){
				JSONObject doc = row.optJSONObject("doc");
				if( null != doc ){
					JSONObject result = getPublicUserFromUser(doc);
					return result;
				}
			}

			throw new Exception("Unable to find user with e-mail address: "+emailAddress);
			
		} catch (Exception e) {
			throw new Exception("Error while searching user with e-mail address: "+emailAddress,e);
		}
	}
	
	public JSONObject initUserCreation(String emailAddr) throws Exception {
		JSONObject result = new JSONObject();
		result.put("message", "User creation email was sent to the given address");
		
		userMailNotification.sendUserCreationNotice(emailAddr,"test");
		
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
