package ca.carleton.gcrc.couch.date.impl;

import java.util.List;

public interface DateSource {
	
	public class SearchResults {
		public List<DocumentWithInterval> documentWithIntervals;
		public int clusterCount = 0;
		public int intervalCount = 0;
		public int intervalMatched = 0;
	}

	SearchResults getAllDateIntervals() throws Exception;

	SearchResults getDateIntervalsIntersectingWith(Interval interval) throws Exception;
}
