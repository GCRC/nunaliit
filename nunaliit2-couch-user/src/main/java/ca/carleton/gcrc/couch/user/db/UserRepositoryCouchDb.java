package ca.carleton.gcrc.couch.user.db;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import javax.servlet.http.Cookie;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.user.UserDocument;
import ca.carleton.gcrc.couch.user.UserDesignDocumentImpl;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.impl.CouchContextCookie;

public class UserRepositoryCouchDb implements UserRepository {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchUserDb userDb;
	private CouchDesignDocument nunaliitUserDesignDocument;

	public UserRepositoryCouchDb(
			CouchUserDb userDb
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
			for(JSONObject row : rows){
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
	public void createUser(JSONObject userDoc) throws Exception {
		userDb.createDocument(userDoc);
	}

	@Override
	public void updateUser(JSONObject userDoc) throws Exception {
		userDb.updateDocument(userDoc);
	}

	@Override
	public void recoverPassword(String name, String newPassword) throws Exception {
		try {
			String id = "org.couchdb.user:"+name;
			
			JSONObject userDoc = userDb.getDocument(id);
			
			userDb.computeUserPassword(userDoc, newPassword);
			
			userDb.updateDocument(userDoc);
			
		} catch(Exception e) {
			throw new Exception("Unable to update password: "+name);
		}
	}

	@Override
	public CouchAuthenticationContext getRolesFromAuthentication(Cookie[] cookies) throws Exception {
		CouchContextCookie contextCookie = new CouchContextCookie();
		for(Cookie cookie : cookies){
			contextCookie.setCookie(cookie.getName(), cookie.getValue());
		}
		
		CouchFactory factory = new CouchFactory();
		CouchDb couchDb = factory.getDb(contextCookie, userDb);

		CouchSession session = couchDb.getClient().getSession();
		CouchAuthenticationContext userContext = session.getAuthenticationContext();
		
		return userContext;
	}

	@Override
	public void computeUserPassword(JSONObject userDoc, String password) throws Exception {
		userDb.computeUserPassword(userDoc, password);
	}
	
	@Override
	public Collection<UserDocument> getUsersWithRoles(List<String> roles) throws Exception {
		Collection<UserDocument> usersWithRoles = new Vector<UserDocument>();
		{
			UserDesignDocumentImpl userDesignDocument = UserDesignDocumentImpl.getUserDesignDocument(userDb);
			usersWithRoles = userDesignDocument.getUsersWithRoles(roles);
		}
		return usersWithRoles;
	}
}
