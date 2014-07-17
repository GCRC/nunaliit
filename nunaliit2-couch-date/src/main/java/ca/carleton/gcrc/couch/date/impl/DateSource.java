package ca.carleton.gcrc.couch.date.impl;

import java.util.List;

public interface DateSource {

	List<DocumentWithInterval> getAllDateIntervals() throws Exception;

	List<DocumentWithInterval> getDateIntervalsIntersectingWith(Interval interval) throws Exception;
}
