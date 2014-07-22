package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

import ca.carleton.gcrc.couch.date.impl.Interval;

public interface IntervalClusterTree {

	List<Integer> clusterIdsFromInterval(Interval interval);
}
