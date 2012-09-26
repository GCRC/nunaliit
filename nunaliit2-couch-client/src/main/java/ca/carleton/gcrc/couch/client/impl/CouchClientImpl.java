package ca.carleton.gcrc.couch.client.impl;

import java.net.URL;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchServerVersion;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.ReplicationRequest;

public class CouchClientImpl implements CouchClient {

	private CouchContext context;
	private URL url;
	private URL uuidUrl;
	private CouchServerVersion version = null;
	private Queue<String> uuids = new LinkedList<String>();
	
	public CouchClientImpl(CouchContext context, URL url) throws Exception {
		this.context = context;
		this.url = url;
		
		this.uuidUrl = new URL(url, "_uuids");
	}

	@Override
	public CouchContext getContext() {
		return context;
	}

	@Override
	public URL getUrl() {
		return url;
	}

	@Override
	public CouchServerVersion getVersion() throws Exception {
		if( null != version ) {
			return version;
		} else {
			JSONObject obj = ConnectionUtils.getJsonResource(context, url);
			
			// Parse version
			Object jsonVersion = obj.get("version");
			if( null != jsonVersion && jsonVersion instanceof String ) {
				String[] versions = ((String)jsonVersion).split("\\.");
				if( versions.length >= 2 ) {
					int major = Integer.parseInt(versions[0]);
					int minor = Integer.parseInt(versions[1]);
					version = new CouchServerVersionImpl(major,minor);
					
					return version;
				}
			}
			
			throw new Exception("Unable to parse server version: "+jsonVersion);
		}
	}

	public void setVersion(CouchServerVersion version) {
		this.version = version;
	}

	@Override
	public String getUuid() throws Exception {
		synchronized( uuids ) {
			if( uuids.size() > 0 ) {
				String uuid = uuids.remove();
				return uuid;
			}
		}
		
		// Make request
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameter(uuidUrl, new UrlParameter("count", "10"));
		JSONObject obj = ConnectionUtils.getJsonResource(context, effectiveUrl);
		
		// Parse
		Object uuidsObj = obj.get("uuids");
		if( null == uuidsObj ) {
			throw new Exception("Unable to parse UUIDs response");
		}
		if( false == (uuidsObj instanceof JSONArray) ) {
			throw new Exception("Unexpected class for array: "+uuidsObj.getClass().getSimpleName());
		}
		JSONArray uuidsArray = (JSONArray)uuidsObj;
		
		String uuid = null;
		synchronized( uuids ) {
			for(int loop=0, end=uuidsArray.length(); loop<end; ++loop) {
				uuid = uuidsArray.getString(loop);
				uuids.add(uuid);
			}
			
			uuid = uuids.remove();
		}
		
		return uuid;
	}

	@Override
	public CouchSession getSession() throws Exception {
		// Compute url
		URL effectiveUrl = new URL(url, "_session/");
		
		CouchSessionImpl couchSession = new CouchSessionImpl(this, effectiveUrl);
		
		return couchSession;
	}

	@Override
	public void validateContext() throws Exception {
		// Compute url
		URL effectiveUrl = new URL(url, "_session");
		
		JSONObject response = ConnectionUtils.getJsonResource(context, effectiveUrl, JSONObject.class);
		
		boolean ok = response.optBoolean("ok",false);
		if( false == ok ){
			throw new Exception("Unable to log in with CouchDb server");
		}
	}

	@Override
	public List<String> listDatabases() throws Exception {
		// Compute url
		URL effectiveUrl = new URL(url, "_all_dbs");

		JSONArray arr = ConnectionUtils.getJsonResource(context, effectiveUrl, JSONArray.class);
		
		// Parse response
		List<String> result = new Vector<String>();
		try {
			for(int i=0,e=arr.length(); i<e; ++i) {
				result.add( arr.getString(i) );
			}
		} catch(Exception e) {
			throw new Exception("Error parsing database list",e);
		}
		
		return result;
	}

	@Override
	public CouchDb createDatabase(String dbName) throws Exception {
		// Compute url
		URL effectiveUrl = new URL(url, dbName+"/");
		
		JSONObject response = ConnectionUtils.putJsonResource(context, effectiveUrl, null);
		
		ConnectionUtils.captureReponseErrors(response, "Error while creating database "+dbName+": ");
		
		CouchDbImpl db = new CouchDbImpl(this, effectiveUrl);
		
		return db;
	}

	@Override
	public boolean databaseExists(String dbName) throws Exception {
		List<String> dbs = listDatabases();
		for(String db : dbs) {
			if( db.equals(dbName) ) {
				return true;
			}
		}
		return false;
	}

	@Override
	public CouchDb getDatabase(String dbName) throws Exception {
		// Compute url
		URL effectiveUrl = new URL(url, dbName+"/");
		
		CouchDbImpl couchDb = new CouchDbImpl(this, effectiveUrl);
		
		return couchDb;
	}

	@Override
	public void deleteDatabase(CouchDb couchDb) throws Exception {
		URL effectiveUrl = couchDb.getUrl();
		
		JSONObject response = ConnectionUtils.deleteJsonResource(context, effectiveUrl);
		
		ConnectionUtils.captureReponseErrors(response, "Error while deleting database "+effectiveUrl+": ");
	}

	@Override
	public CouchUserDb getUserDatabase() throws Exception {
		// Compute url
		URL effectiveUrl = new URL(url, "_users/");
		
		CouchUserDbImpl couchUserDb = new CouchUserDbImpl(this, effectiveUrl);
		
		return couchUserDb;
	}

	@Override
	public JSONObject replicate(
			ReplicationRequest replicationRequest
			) throws Exception {

		URL effectiveUrl = new URL(url, "_replicate");
		
		String source = CouchUtils.computeEffectiveDatabaseUrl(
			replicationRequest.getSourceServerUrl()
			,replicationRequest.getSourceUserName()
			,replicationRequest.getSourcePassword()
			,replicationRequest.getSourceDbName()
			);
		String target = CouchUtils.computeEffectiveDatabaseUrl(
			replicationRequest.getTargetServerUrl()
			,replicationRequest.getTargetUserName()
			,replicationRequest.getTargetPassword()
			,replicationRequest.getTargetDbName()
			);
		
		JSONObject request = new JSONObject();
		request.put("source",source);
		request.put("target",target);
		
		if( replicationRequest.isContinuous() ) {
			request.put("continuous", true);
		}
		
		if( replicationRequest.isCancel() ) {
			request.put("cancel", true);
		}
		
		if( null != replicationRequest.getFilter() ) {
			request.put("filter", replicationRequest.getFilter());
		}
		
		if( null != replicationRequest.getDocIds() ) {
			JSONArray arr = new JSONArray();
			
			for(String docId : replicationRequest.getDocIds()) {
				arr.put(docId);
			}
			
			request.put("doc_ids", arr);
		}
		
		// POST
		JSONObject response = ConnectionUtils.postJsonResource(getContext(), effectiveUrl, request);
		
		ConnectionUtils.captureReponseErrors(response, "Error while replicating "+source+" -> "+target);

		return response;
	}

	@Override
	public JSONArray activeTasks() throws Exception {

		URL effectiveUrl = new URL(url, "_active_tasks");
		
		JSONArray response = ConnectionUtils.getJsonResource(getContext(), effectiveUrl, JSONArray.class);
		
		ConnectionUtils.captureReponseErrors(response, "Error while obtaining active tasks");

		return response;
	}
}
