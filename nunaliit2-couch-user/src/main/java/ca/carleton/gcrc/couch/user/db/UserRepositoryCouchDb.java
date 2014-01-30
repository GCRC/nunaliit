package ca.carleton.gcrc.couch.user.db;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

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
			query.setViewName("emails");
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
}
