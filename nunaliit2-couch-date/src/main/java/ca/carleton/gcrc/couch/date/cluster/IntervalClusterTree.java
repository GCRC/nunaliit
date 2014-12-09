package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.impl.NowReference;
import ca.carleton.gcrc.couch.date.impl.TimeInterval;

/**
 * Structure to index a large number of elements according to the
 * associated interval. This interface provides the calls to
 * search the database given an interval.
 */
public interface IntervalClusterTree {

	List<Integer> clusterIdsFromInterval(TimeInterval interval, NowReference now) throws Exception;
}
