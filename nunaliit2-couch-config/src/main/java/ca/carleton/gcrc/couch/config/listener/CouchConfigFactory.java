package ca.carleton.gcrc.couch.config.listener;

import org.apache.log4j.Logger;

import org.json.JSONArray;
import org.json.JSONObject;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.ReplicationRequest;
import ca.carleton.gcrc.json.JSONSupport;

public class CouchConfigFactory {

	final static public String REPLICATION_DIRECTION_OUTGOING = "outgoing";
	final static public String REPLICATION_DIRECTION_INCOMING = "incoming";
	final static public String REPLICATION_DIRECTION_BIDIRECTIONAL = "bidirectional";
	
	final protected Logger logger = Logger.getLogger(this.getClass());

	private String serverName = null;
	private CouchDesignDocument configDesign = null;
	private String viewName = "config-by-server-name";

	public String getServerName() {
		return serverName;
	}

	public void setServerName(String serverName) {
		this.serverName = serverName;
	}

	public CouchDesignDocument getConfigDesign() {
		return configDesign;
	}

	public void setConfigDesign(CouchDesignDocument configDesign) {
		this.configDesign = configDesign;
	}
	
	public String getViewName() {
		return viewName;
	}

	public void setViewName(String viewName) {
		this.viewName = viewName;
	}

	public void createDefaultConfigurationObject() throws Exception {
		JSONObject doc = new JSONObject();
		doc.put("_id", "org.nunaliit.serverConfig:"+serverName);
		doc.put("nunaliit_type", "serverConfig");
		doc.put("server", serverName);
		doc.put("replicationInterval", 3600);
		doc.put("replications", new JSONArray());
		
		configDesign.getDatabase().createDocument(doc);
	}

	public CouchConfig retrieveConfigurationObject() throws Exception {
		CouchQuery query = new CouchQuery();
		query.setViewName(viewName);
		query.setStartKey(serverName);
		query.setEndKey(serverName);
		
		CouchQueryResults results;
		try {
			results = configDesign.performQuery(query);
		} catch (Exception e) {
			throw new Exception("Error accessing view: "+viewName,e);
		}
		
		// Analyze configuration
		if( results.getRows().size() < 1 ) {
			throw new Exception("Configuration with id "+serverName+" not found.");
		}
		CouchConfig config = null;
		try {
			JSONObject row = results.getRows().get(0);
			JSONObject doc = row.getJSONObject("value");

			config = parseJSON(doc);

		} catch(Exception e) {
			throw new Exception("Error parsing configuration object: "+serverName,e);
		}
			
		return config;
	}
	
	public CouchConfig parseJSON(JSONObject doc) throws Exception {
		String rev = doc.getString("_rev");
		if( null == rev ) {
			throw new Exception("Unable to read attribute '_rev'");
		}

		CouchConfigImpl config = new CouchConfigImpl(configDesign, doc);
		config.setRevision( doc.getString("_rev") );
		config.setServer( doc.getString("server") );
		
		if( JSONSupport.containsKey(doc,"replicationInterval") ) {
			int interval = doc.getInt("replicationInterval");
			config.setReplicationInterval( new Integer(interval) );
		}
		
		JSONArray replications = doc.optJSONArray("replications");
		if( null != replications ) {
			for(int i=0, e=replications.length(); i<e; ++i) {
				JSONObject replicationJson = replications.getJSONObject(i);
				String direction = replicationJson.optString("direction");
				
				// Outgoing
				if( REPLICATION_DIRECTION_OUTGOING.equals(direction)
				 || REPLICATION_DIRECTION_BIDIRECTIONAL.equals(direction) ) {
					ReplicationRequest replicationRequest = new ReplicationRequest();
					
					replicationRequest.setSourceDbName( replicationJson.getString("localDbName") );
					replicationRequest.setTargetDbName( replicationJson.getString("remoteDbName") );
					replicationRequest.setTargetServerUrl( replicationJson.getString("remoteServerUrl") );
					
					replicationRequest.setTargetUserName( ReplicationRequest.REMOTE_USER_NAME );
					replicationRequest.setTargetPassword( ReplicationRequest.REMOTE_USER_PASSWORD );
					
					String filterName = replicationJson.optString("filterName", null);
					if( null != filterName ) {
						replicationRequest.setFilter( filterName );
					}
					
					boolean continuous = replicationJson.optBoolean("continuous",false);
					if( continuous ) {
						replicationRequest.setContinuous(true);
					}
					
					config.addReplication(replicationRequest);
				}
				
				// Incoming
				if( REPLICATION_DIRECTION_INCOMING.equals(direction)
				 || REPLICATION_DIRECTION_BIDIRECTIONAL.equals(direction) ) {
					ReplicationRequest replicationRequest = new ReplicationRequest();
					
					replicationRequest.setTargetDbName( replicationJson.getString("localDbName") );
					replicationRequest.setSourceDbName( replicationJson.getString("remoteDbName") );
					replicationRequest.setSourceServerUrl( replicationJson.getString("remoteServerUrl") );

					replicationRequest.setSourceUserName( ReplicationRequest.REMOTE_USER_NAME );
					replicationRequest.setSourcePassword( ReplicationRequest.REMOTE_USER_PASSWORD );
					
					String filterName = replicationJson.optString("filterName", null);
					if( null != filterName ) {
						replicationRequest.setFilter( filterName );
					}
					
					boolean continuous = replicationJson.optBoolean("continuous",false);
					if( continuous ) {
						replicationRequest.setContinuous(true);
					}
					
					config.addReplication(replicationRequest);
				}
			}
		};
		
		return config;
	}
}
