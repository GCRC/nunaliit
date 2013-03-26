package ca.carleton.gcrc.couch.user;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.fsentry.FSEntryResource;

public class UserDesignDocument {
	
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
			{
				boolean exists = couchDb.documentExists(DD_ID);
				if( exists ) {
					JSONObject uploaded = couchDb.getDocument(DD_ID);
					if( null != uploaded ){
						int uploadedVersion = uploaded.optInt(PROP_NAME_VERSION, 0);
						if( uploadedVersion > diskVersion ){
							updateRequired = false;
						}
					}
				}
			}
			
			if( updateRequired ) {
				DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
				updateProcess.update(doc);
			}

		} catch(Exception e) {
			throw new Exception("Unable to create/update nunaliit_user design document",e);
		}
	}
	
}
