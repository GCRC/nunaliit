package ca.carleton.gcrc.couch.user.db;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Vector;

import javax.servlet.http.Cookie;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchUserContext;
import ca.carleton.gcrc.couch.client.impl.CouchContextCookie;

public class UserRepositoryCouchDb implements UserRepository {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb userDb;
	private CouchDesignDocument nunaliitUserDesignDocument;

	public UserRepositoryCouchDb(
			CouchDb userDb
			,CouchDesignDocument nunaliitUserDesignDocument
		){
		this.userDb = userDb;
		this.nunaliitUserDesignDocument = nunaliitUserDesignDocument;
	}

	@Override
	public JSONObject getUserFromName(String name) throws Exception {
		String id = "org.couchdb.user:"+name;
		return getUserFromId(id);
	}

	@Override
	public JSONObject getUserFromId(String id) throws Exception {
		return userDb.getDocument(id);
	}

	@Override
	public Collection<JSONObject> getUsersFromNames(List<String> names) throws Exception {
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
		
		return userDocs;
	}

	@Override
	public JSONObject getUserFromEmailAddress(String emailAddress) throws Exception {
		try {
			CouchQuery query = new CouchQuery();
			query.setViewName("validated-emails");
			query.setStartKey(emailAddress);
			query.setEndKey(emailAddress);
			query.setIncludeDocs(true);

			CouchQueryResults results = nunaliitUserDesignDocument.performQuery(query);
			List<JSONObject> rows = results.getRows();
			logger.error("rows:"+rows.size());
			for(JSONObject row : rows){
				logger.error("row:"+row);
				JSONObject doc = row.optJSONObject("doc");
				if( null != doc ){
					return doc;
				}
			}

			throw new Exception("Unable to find user with e-mail address: "+emailAddress);
			
		} catch (Exception e) {
			throw new Exception("Error while searching user with e-mail address: "+emailAddress,e);
		}
	}

	@Override
	public void createUser(
			String name, 
			String displayName, 
			String password,
			String emailAddress,
			String atlasName,
			String userAgreement
		) throws Exception {
		try {
			String id = "org.couchdb.user:"+name;
			
			JSONObject userDoc = new JSONObject();
			userDoc.put("_id", id);
			userDoc.put("name", name);
			userDoc.put("password", password);
			userDoc.put("type", "user");
			userDoc.put("roles", new JSONArray());
			userDoc.put("nunaliit_emails", new JSONArray());
			userDoc.put("nunaliit_validated_emails", new JSONArray());
			userDoc.put("nunaliit_options", new JSONObject());
			
			if( null != displayName ){
				userDoc.put("display", displayName);
			}
			
			if( null != emailAddress ){
				JSONArray validatedEmails = userDoc.getJSONArray("nunaliit_validated_emails");
				validatedEmails.put(emailAddress);

				JSONArray emails = userDoc.getJSONArray("nunaliit_emails");
				emails.put(emailAddress);
			}
			
			// Remember that user was created on this atlas
			{
				JSONObject atlases = new JSONObject();
				userDoc.put("nunaliit_atlases",atlases);
				
				JSONObject atlas = new JSONObject();
				atlases.put(atlasName, atlas);
				
				atlas.put("name", atlasName);
				atlas.put("created", true);
			}
			
			// User agreement
			if( null != userAgreement ){
				Date now = new Date();
				
				JSONObject jsonAgreement = new JSONObject();
				userDoc.put("nunaliit_accepted_user_agreements", jsonAgreement);
				
				JSONObject atlasSpecific = new JSONObject();
				jsonAgreement.put(atlasName, atlasSpecific);
				
				atlasSpecific.put("atlas", atlasName);
				atlasSpecific.put("content", userAgreement);
				atlasSpecific.put("time", now.getTime());
			}
			
			userDb.createDocument(userDoc);
			
		} catch(Exception e) {
			throw new Exception("Unable to create user: "+name);
		}
	}

	@Override
	public void recoverPassword(String name, String newPassword) throws Exception {
		try {
			String id = "org.couchdb.user:"+name;
			
			JSONObject userDoc = userDb.getDocument(id);
			
			userDoc.put("password", newPassword);
			
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
			
			userDb.updateDocument(userDoc);
			
		} catch(Exception e) {
			throw new Exception("Unable to update password: "+name);
		}
	}

	@Override
	public List<String> getRolesFromAuthentication(Cookie[] cookies) throws Exception {
		CouchContextCookie contextCookie = new CouchContextCookie();
		for(Cookie cookie : cookies){
			contextCookie.setCookie(cookie.getName(), cookie.getValue());
		}
		
		CouchFactory factory = new CouchFactory();
		CouchDb couchDb = factory.getDb(contextCookie, userDb);

		CouchSession session = couchDb.getClient().getSession();
		CouchUserContext userContext = session.getCurrentUserContext();
		
		return userContext.getRoles();
	}
}
