package ca.carleton.gcrc.couch.onUpload;

import java.util.Properties;

public class UploadWorkerSettings {

	private String atlasName = null;
	private boolean geometrySimplificationDisabled = false;
	
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

	public boolean isGeometrySimplificationDisabled() {
		return geometrySimplificationDisabled;
	}

	public void setGeometrySimplificationDisabled(boolean geometrySimplificationDisabled) {
		this.geometrySimplificationDisabled = geometrySimplificationDisabled;
	}
	
}
