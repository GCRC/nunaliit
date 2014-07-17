package ca.carleton.gcrc.couch.date;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.date.impl.DateSource;
import ca.carleton.gcrc.couch.date.impl.DocumentWithInterval;
import ca.carleton.gcrc.couch.date.impl.Interval;

public class DateServiceActions {
	
	private DateSource dateSource;
	
	public DateServiceActions(DateSource dateSource){
		this.dateSource = dateSource;
	}

	public JSONObject getDocIdsFromInterval(long min, long max) throws Exception {
		Interval interval = new Interval(min,max);
		List<DocumentWithInterval> docWithInts = dateSource.getDateIntervalsIntersectingWith(interval);
		
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
		
		return result;
	}
}
