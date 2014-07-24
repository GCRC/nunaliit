package ca.carleton.gcrc.couch.date;

import java.io.PrintWriter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.date.impl.DateSource;
import ca.carleton.gcrc.couch.date.impl.DocumentWithInterval;
import ca.carleton.gcrc.couch.date.impl.Interval;
import ca.carleton.gcrc.couch.date.impl.SerializableToDot;
import ca.carleton.gcrc.couch.date.impl.SerializableToInfo;

public class DateServiceActions {
	
	private DateSource dateSource;
	
	public DateServiceActions(DateSource dateSource){
		this.dateSource = dateSource;
	}

	public JSONObject getDocIdsFromInterval(long min, long max) throws Exception {
		Interval interval = new Interval(min,max);
		DateSource.SearchResults searchResults = dateSource.getDateIntervalsIntersectingWith(interval);
		List<DocumentWithInterval> docWithInts = searchResults.documentWithIntervals;
		
		Set<String> docIds = new HashSet<String>();
		for(DocumentWithInterval docWithInt : docWithInts){
			docIds.add(docWithInt.getDocId());
		}
		
		JSONObject result = new JSONObject();
		
		JSONArray arr = new JSONArray();
		for(String docId : docIds){
			arr.put(docId);
		}
		result.put("docIds", arr);
		
		result.put("clusterCount", searchResults.clusterCount);
		result.put("intervalCount", searchResults.intervalCount);
		result.put("intervalMatched", searchResults.intervalMatched);
		
		return result;
	}

	public void getInfo(PrintWriter pw) throws Exception {
		if( dateSource instanceof SerializableToInfo ){
			SerializableToInfo infoSource = (SerializableToInfo)dateSource;
			infoSource.printInfo(pw);
		}
	}

	public void getDotInfo(PrintWriter pw) throws Exception {
		if( dateSource instanceof SerializableToDot ){
			SerializableToDot dotSource = (SerializableToDot)dateSource;
			dotSource.printDot(pw);
		}
	}
}
