package ca.carleton.gcrc.couch.user;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.fsentry.FSEntryResource;

public class UserDesignDocumentImpl implements UserDesignDocument {

	final static protected Logger logger = LoggerFactory.getLogger(UserDesignDocumentImpl.class);
	
	final static public String DD_NAME = "nunaliit_user";
	final static public String DD_ID = "_design/" + DD_NAME;
	final static public String PROP_NAME_VERSION = "nunaliit_version";

	static public void updateDesignDocument(CouchDb couchDb) throws Exception {
		
		try {
			// Get document from resources
			FSEntryResource resourceFile = FSEntryResource.create(UserDesignDocument.class.getClassLoader(), "userDesignDocument");
			Document doc = DocumentFile.createDocument(resourceFile, resourceFile);
			
			// Get current version of document
			int diskVersion = 0;
			{
				JSONObject jsonDoc = doc.getJSONObject();
				diskVersion = jsonDoc.optInt(PROP_NAME_VERSION, 0);
			}

			// Get document from the database, if it exists, and figure out if
			// the disk version is newer than that found in the database
			boolean updateRequired = true;
			int uploadedVersion = 0;
			{
				boolean exists = couchDb.documentExists(DD_ID);
				if( exists ) {
					JSONObject uploaded = couchDb.getDocument(DD_ID);
					if( null != uploaded ){
						uploadedVersion = uploaded.optInt(PROP_NAME_VERSION, 0);
						if( uploadedVersion > diskVersion ){
							updateRequired = false;
						}
					}
				}
			}
			
			logger.info("User design document. Disk: "+diskVersion
					+" Db: "+uploadedVersion
					+" Update Required: "+updateRequired
					);
			
			if( updateRequired ) {
				DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
				updateProcess.update(doc);
			}

		} catch(Exception e) {
			throw new Exception("Unable to create/update nunaliit_user design document",e);
		}
	}

	static public UserDesignDocumentImpl getUserDesignDocument(CouchClient couchClient) throws Exception {
		if( false == couchClient.databaseExists("_users") ) {
			throw new Exception("_users database not found");
		}
		
		CouchDb userDb = couchClient.getDatabase("_users");
		return getUserDesignDocument(userDb);
	}

	static public UserDesignDocumentImpl getUserDesignDocument(CouchDb couchDb) throws Exception {

		if( false == couchDb.documentExists(DD_ID) ) {
			throw new Exception("Design document "+DD_ID+" was not found");
		}

		CouchDesignDocument dd = couchDb.getDesignDocument(DD_NAME);
		return new UserDesignDocumentImpl(dd);
	}
	
	private CouchDesignDocument dd;
	
	public UserDesignDocumentImpl(CouchDesignDocument dd){
		this.dd = dd;
	}
	
	@Override
	public CouchDesignDocument getSupportingDesignDocument(){
		return dd;
	}
	
	@Override
	public Collection<UserDocument> getUsersWithRole(String role) throws Exception {
		List<String> roles = new ArrayList<String>(1);
		roles.add(role);
		return getUsersWithRoles(roles);
	}
	
	@Override
	public Collection<UserDocument> getUsersWithRoles(List<String> roles) throws Exception {
		CouchQuery query = new CouchQuery();
		query.setViewName("roles");
		query.setIncludeDocs(true);
		query.setReduce(false);
		query.setKeys(roles);
		
		CouchQueryResults results = dd.performQuery(query);
		List<JSONObject> rows = results.getRows();
		
		// Accumulate users
		Map<String,JSONObject> idToUser = new HashMap<String,JSONObject>();
		for(JSONObject row : rows){
			JSONObject doc = row.optJSONObject("doc");
			if( null != doc ){
				String id = doc.optString("_id",null);
				if( null != id ) {
					idToUser.put(id, doc);
				}
			}
		}
		
		// Create instances of UserDocument
		List<UserDocument> users = new ArrayList<UserDocument>(rows.size());
		for(JSONObject doc : idToUser.values()){
			UserDocument user = new UserDocument(doc);
			users.add(user);
		}
		
		return users;
	}
}
