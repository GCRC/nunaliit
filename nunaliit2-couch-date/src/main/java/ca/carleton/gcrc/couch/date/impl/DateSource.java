package ca.carleton.gcrc.couch.date.impl;

import java.util.List;

/**
 * 
 * This interface is supported by all components where documents that
 * contain dates can be found.
 *
 */
public interface DateSource {
	
	public class SearchResults {
		public List<DocumentWithInterval> documentWithIntervals;
		public int clusterCount = 0;
		public int intervalCount = 0;
		public int intervalMatched = 0;
	}

	/**
	 * Get all date intervals found in the database.
	 * @return
	 * @throws Exception
	 */
	SearchResults getAllDateIntervals() throws Exception;

	/**
	 * Return a subset of all date intervals found in the database, the ones
	 * intersecting with the given interval.
	 * @param interval Interval with which the date should intersect to be considered.
	 * @return
	 * @throws Exception
	 */
	SearchResults getDateIntervalsIntersectingWith(TimeInterval interval, NowReference now) throws Exception;
}
