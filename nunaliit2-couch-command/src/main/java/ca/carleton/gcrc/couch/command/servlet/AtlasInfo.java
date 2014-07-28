package ca.carleton.gcrc.couch.command.servlet;

import org.json.JSONObject;

public class AtlasInfo {
	private String databaseName = null;
	private String atlasName = null;
	private boolean restricted = false;
	private String submissionDbName = null;
	private boolean submissionDbEnabled = false;
	
	public AtlasInfo(String databaseName, String atlasName, boolean restricted){
		this.databaseName = databaseName;
		this.atlasName = atlasName;
		this.restricted = restricted;
	}
	
	public String getDatabaseName() {
		return databaseName;
	}

	public String getAtlasName() {
		return atlasName;
	}

	public boolean isRestricted() {
		return restricted;
	}

	public String getSubmissionDbName() {
		return submissionDbName;
	}

	public void setSubmissionDbName(String submissionDbName) {
		this.submissionDbName = submissionDbName;
	}

	public boolean isSubmissionDbEnabled() {
		return submissionDbEnabled;
	}

	public void setSubmissionDbEnabled(boolean submissionDbEnabled) {
		this.submissionDbEnabled = submissionDbEnabled;
	}

	public JSONObject toJSON() throws Exception {
		JSONObject json = new JSONObject();

		if( null != databaseName ){
			json.put("dbName", databaseName);
		}

		if( null != atlasName ){
			json.put("atlasName", atlasName);
		}

		json.put("restricted", restricted);

		if( null != submissionDbName ){
			json.put("submissionDbName", submissionDbName);
		}

		json.put("submissionDbEnabled", submissionDbEnabled);
		
		return json;
	}
}
