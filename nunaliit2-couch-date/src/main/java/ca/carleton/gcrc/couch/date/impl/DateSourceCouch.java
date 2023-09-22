package ca.carleton.gcrc.couch.date.impl;

import java.util.ArrayList;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class DateSourceCouch implements DateSource {

	private CouchDesignDocument atlasDesignDocument;	
	
	public DateSourceCouch(CouchDesignDocument atlasDesignDocument){
		this.atlasDesignDocument = atlasDesignDocument;
	}
	
	@Override
	public SearchResults getAllDateIntervals() throws Exception {
		SearchResults results = new SearchResults();
		
		CouchQuery query = new CouchQuery();
		query.setViewName("date-index");
		query.setIncludeDocs(false);
		query.setReduce(false);
		CouchQueryResults queryResults = atlasDesignDocument.performQuery(query);
		
		results.documentWithIntervals = new ArrayList<DocumentWithInterval>(queryResults.getRows().size());
		for(JSONObject row : queryResults.getRows()){
			String docId = row.optString("id", null);
			JSONObject jsonInterval = row.optJSONObject("value");
			if( null != docId && null != jsonInterval ){
				TimeInterval interval = TimeInterval.fromJson(jsonInterval);
				DocumentWithInterval docWithInt = new DocumentWithInterval(docId, interval);
				results.documentWithIntervals.add(docWithInt);
			}
		}
		
		return results;
	}

	@Override
	public SearchResults getDateIntervalsIntersectingWith(TimeInterval range, NowReference now) throws Exception {
		SearchResults results = new SearchResults();

		CouchQuery query = new CouchQuery();
		query.setViewName("date-index");
		query.setIncludeDocs(false);
		query.setReduce(false);
		CouchQueryResults queryResults = atlasDesignDocument.performQuery(query);
		
		results.documentWithIntervals = new ArrayList<DocumentWithInterval>(queryResults.getRows().size());
		for(JSONObject row : queryResults.getRows()){
			String docId = row.optString("id", null);
			JSONObject jsonInterval = row.optJSONObject("value");
			results.intervalCount++;
			if( null != docId && null != jsonInterval ){
				TimeInterval interval = TimeInterval.fromJson(jsonInterval);
				if( interval.intersectsWith(range, now) ){
					DocumentWithInterval docWithInt = new DocumentWithInterval(docId, interval);
					results.documentWithIntervals.add(docWithInt);
					results.intervalMatched++;
				}
			}
		}
		
		return results;
	}
}
