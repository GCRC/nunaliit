package ca.carleton.gcrc.couch.date.cluster;

import ca.carleton.gcrc.couch.date.impl.Interval;

public interface TreeElement {
	
	/**
	 * Returns the interval associated with the element.
	 * @return
	 */
	Interval getInterval();
	
	/**
	 * Returns the tree node identifier that this element is associated
	 * with
	 * @return
	 */
	Integer getClusterId();
}
