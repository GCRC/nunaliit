package ca.carleton.gcrc.couch.onUpload;

import java.util.Properties;

import ca.carleton.gcrc.couch.client.CouchUserDb;

public class UploadWorkerSettings {

	private String atlasName = null;
	private boolean geometrySimplificationDisabled = false;
	private CouchUserDb userDb = null;
	
	public UploadWorkerSettings(){
		
	}
	
	public UploadWorkerSettings(Properties props){
		this.parseProperties(props);
	}
	
	public void parseProperties(Properties props){
	}

	public String getAtlasName() {
		return atlasName;
	}

	public void setAtlasName(String atlasName) {
		this.atlasName = atlasName;
	}

	public CouchUserDb getUserDb() {
		return userDb;
	}

	public void setUserDb(CouchUserDb userDb) {
		this.userDb = userDb;
	}

	public boolean isGeometrySimplificationDisabled() {
		return geometrySimplificationDisabled;
	}

	public void setGeometrySimplificationDisabled(boolean geometrySimplificationDisabled) {
		this.geometrySimplificationDisabled = geometrySimplificationDisabled;
	}
	
}
