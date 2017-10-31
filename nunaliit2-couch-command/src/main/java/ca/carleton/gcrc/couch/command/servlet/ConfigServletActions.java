package ca.carleton.gcrc.couch.command.servlet;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.utils.VersionUtils;

public class ConfigServletActions {

	private CouchClient couchClient;
	private CouchDb couchDb;
	private String couchDbName;
	private boolean submissionDbEnabled = false;
	private JSONObject cached_welcome = null;

	public ConfigServletActions(CouchDb couchDb, String couchDbName){
		this.couchDb = couchDb;
		this.couchClient = couchDb.getClient();
		this.couchDbName = couchDbName;
	}
	
	synchronized public JSONObject getWelcome() throws Exception{
		if( null == cached_welcome ){
			cached_welcome = new JSONObject();
			cached_welcome.put("ConfigServlet", true);
			
			cached_welcome.put("submissionDbEnabled", submissionDbEnabled);
			
			{
				String version = VersionUtils.getVersion();
				if( null != version ){
					cached_welcome.put("version", version);
				}
			}

			{
				String dateStr = VersionUtils.getDateString();
				if( null != dateStr ){
					cached_welcome.put("date", dateStr);
				}
			}

			{
				String buildStr = VersionUtils.getBuildString();
				if( null != buildStr ){
					cached_welcome.put("build", buildStr);
				}
			}
		}
		
		return cached_welcome;
	}
	
	public boolean isSubmissionDbEnabled(){
		return submissionDbEnabled;
	}
	
	public void setSubmissionDbEnabled(boolean submissionDbEnabled){
		this.submissionDbEnabled = submissionDbEnabled;
	}
	
	public AtlasInfo getCurrentAtlasInfo() throws Exception {
		return getAtlasInfo(couchDb, couchDbName);
	}
	
	public AtlasInfo getAtlasInfo(String databaseName) throws Exception {
		CouchDb db = couchClient.getDatabase(databaseName);
		return getAtlasInfo(db, databaseName);
	}
	
	public AtlasInfo getAtlasInfo(CouchDb db, String databaseName) throws Exception {
		JSONObject atlasDesign = db.getDocument("_design/atlas");
		JSONObject nunaliit = atlasDesign.optJSONObject("nunaliit");
		String atlasName = nunaliit.getString("name");
		boolean restricted = nunaliit.optBoolean("restricted",false);
		String submissionDbName = nunaliit.optString("submissionDbName",null);
		boolean submissionDbEnabled = nunaliit.optBoolean("submissionDbEnabled",false);
		
		AtlasInfo info = new AtlasInfo(databaseName, atlasName, restricted);
		info.setSubmissionDbName(submissionDbName);
		info.setSubmissionDbEnabled(submissionDbEnabled);

		return info;
	}
	
	public List<AtlasInfo> getNunaliitAtlases() throws Exception {
		List<String> databaseNames = couchClient.listDatabases();
		
		List<AtlasInfo> result = new ArrayList<AtlasInfo>(databaseNames.size());
		
		for(String databaseName : databaseNames){
			try {
				if( databaseName.length() > 0 
				 && databaseName.charAt(0) != '_' ){
					AtlasInfo info = getAtlasInfo(databaseName);
					result.add(info);
				}
			} catch (Exception e) {
				// Ignore
			}
		}
		
		return result;
	}
	
	public Collection<String> getNunaliitAtlasRoles(AtlasInfo atlasInfo) throws Exception {
		Set<String> roles = new HashSet<String>();
		
		roles.add(atlasInfo.getAtlasName() + "_administrator");
		roles.add(atlasInfo.getAtlasName() + "_vetter");
		
		if( atlasInfo.isRestricted() ){
			roles.add(atlasInfo.getAtlasName() + "_user");
		}
		
		CouchDb atlasDb = couchClient.getDatabase(atlasInfo.getDatabaseName());
		CouchDesignDocument atlasDesign = atlasDb.getDesignDocument("atlas");

		// Roles from layer definitions
		{
			CouchQuery query = new CouchQuery();
			query.setViewName("layer-definitions");
			CouchQueryResults queryResults = atlasDesign.performQuery(query);
			for(JSONObject row : queryResults.getRows()){
				String layerId = row.getString("key");
				if( "public".equals(layerId) ) {
					// Do not include public layer
				} else if( null != layerId && layerId.startsWith("public_") ) {
					// Do not include public layers
				} else {
					String layerRole = atlasInfo.getAtlasName() + "_layer_" + layerId;
					roles.add(layerRole);
				}
			}
		}

		// Roles from layers in use
		{
			CouchQuery query = new CouchQuery();
			query.setViewName("layers");
			query.setReduce(true);
			query.setGrouping(true);
			CouchQueryResults queryResults = atlasDesign.performQuery(query);
			for(JSONObject row : queryResults.getRows()){
				String layerId = row.getString("key");
				if( false == "public".equals(layerId) ) {
					String layerRole = atlasInfo.getAtlasName() + "_layer_" + layerId;
					roles.add(layerRole);
				}
			}
		}

		return roles;
	}
	
	public Collection<String> getNunaliitServerRoles() throws Exception {
		Set<String> roles = new HashSet<String>();
		
		List<AtlasInfo> atlases = getNunaliitAtlases();
		for(AtlasInfo atlasInfo : atlases){
			Collection<String> atlasRoles = getNunaliitAtlasRoles(atlasInfo);
			roles.addAll(atlasRoles);
		}

		return roles;
	}
}
