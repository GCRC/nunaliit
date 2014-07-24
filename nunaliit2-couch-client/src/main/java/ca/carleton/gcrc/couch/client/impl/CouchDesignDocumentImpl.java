package ca.carleton.gcrc.couch.client.impl;

import java.net.URL;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class CouchDesignDocumentImpl implements CouchDesignDocument {

	private CouchDb database;
	private URL url;
	
	public CouchDesignDocumentImpl(CouchDb database, URL url) {
		this.database = database;
		this.url = url;
	}
	
	@Override
	public CouchDb getDatabase() {
		return database;
	}

	@Override
	public CouchContext getContext() {
		return database.getContext();
	}

	@Override
	public URL getUrl() {
		return url;
	}

	@Override
	public CouchQueryResults performQuery(CouchQuery query) throws Exception {
		JSONObject jsonResponse = performQuery(query, JSONObject.class);
		
		CouchQueryResultsImpl results;
		try {
			results = new CouchQueryResultsImpl(jsonResponse);
		} catch (Exception e) {
			throw new Exception("Error while parsing query response",e);
		}
		
		return results;
	}

	@Override
	public <T> T performQuery(CouchQuery query, Class<T> expectedClass) throws Exception {
		if( null == query ) {
			throw new Exception("Must provide a query object during a query");
		}
		if( null == query.getViewName() ) {
			throw new Exception("Must specify a view name during a query");
		}
		
		// Base url
		URL selectUrl = null;
		if( null == query.getListName() ) {
			selectUrl = new URL(url, "_view/"+query.getViewName());
		} else {
			selectUrl = new URL(url, "_list/"+query.getListName()+"/"+query.getViewName());
		}
		
		// Compute parameters
		List<UrlParameter> parameters = new Vector<UrlParameter>();
		if( null != query.getStartKey() ) {
			parameters.add( new UrlParameter("startkey", query.getStartKey()) );
		}
		if( null != query.getEndKey() ) {
			parameters.add( new UrlParameter("endkey", query.getEndKey()) );
		}
		if( null != query.getKeys() ) {
			parameters.add( new UrlParameter("keys", query.getKeys()) );
		}
		if( null != query.getLimit() ) {
			parameters.add( new UrlParameter("limit", query.getLimit()) );
		}
		if( null != query.getIncludeDocs() ) {
			parameters.add( new UrlParameter("include_docs", query.getIncludeDocs()) );
		}
		if( query.isReduce() ){
			parameters.add( new UrlParameter("reduce", "true") );
			
			if( query.isGrouping() ){
				parameters.add( new UrlParameter("group", "true") );
			}
		} else {
			parameters.add( new UrlParameter("reduce", "false") );
		}
		
		// Effective URL
		URL effectiveUrl = ConnectionUtils.computeUrlWithParameters(selectUrl, parameters);
		
		// Make request
		T response = ConnectionUtils.getJsonResource(getContext(), effectiveUrl, expectedClass);
		
		ConnectionUtils.captureReponseErrors(response, "Error while querying view "+effectiveUrl.toString()+": ");
		
		return response;
	}

}
