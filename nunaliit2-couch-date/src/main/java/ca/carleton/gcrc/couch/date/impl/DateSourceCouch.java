package ca.carleton.gcrc.couch.date.impl;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class DateSourceCouch implements DateSource {

//	private CouchDb couchDb;
	private CouchDesignDocument atlasDesignDocument;	
	
	public DateSourceCouch(CouchDb couchDb, CouchDesignDocument atlasDesignDocument){
//		this.couchDb = couchDb;
		this.atlasDesignDocument = atlasDesignDocument;
	}
	
	@Override
	public List<DocumentWithInterval> getAllDateIntervals() throws Exception {
		CouchQuery query = new CouchQuery();
		query.setViewName("date");
		query.setIncludeDocs(false);
		CouchQueryResults results = atlasDesignDocument.performQuery(query);
		
		List<DocumentWithInterval> result = new ArrayList<DocumentWithInterval>(results.getRows().size());
		for(JSONObject row : results.getRows()){
			String docId = row.optString("id");
			JSONArray key = row.optJSONArray("key");
			long min = 0;
			long max = -1;
			if( null != key && key.length() >= 2 ){
				min = key.optLong(0);
				max = key.optLong(1);
			}
			if( null != docId && max >= min ){
				Interval interval = new Interval(min,max);
				DocumentWithInterval docWithInt = new DocumentWithInterval(docId, interval);
				result.add(docWithInt);
			}
		}
		
		return result;
	}

	@Override
	public List<DocumentWithInterval> getDateIntervalsIntersectingWith(Interval range) throws Exception {
		CouchQuery query = new CouchQuery();
		query.setViewName("date");
		query.setIncludeDocs(false);
		CouchQueryResults results = atlasDesignDocument.performQuery(query);
		
		List<DocumentWithInterval> result = new ArrayList<DocumentWithInterval>(results.getRows().size());
		for(JSONObject row : results.getRows()){
			String docId = row.optString("id");
			JSONArray key = row.optJSONArray("key");
			long min = 0;
			long max = -1;
			if( null != key && key.length() >= 2 ){
				min = key.optLong(0);
				max = key.optLong(1);
			}
			if( null != docId && max >= min ){
				Interval interval = new Interval(min,max);
				if( interval.intersectsWith(range) ){
					DocumentWithInterval docWithInt = new DocumentWithInterval(docId, interval);
					result.add(docWithInt);
				}
			}
		}
		
		return result;
	}

}
