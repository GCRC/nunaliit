package ca.carleton.gcrc.couch.date.impl;

import java.util.Date;

/**
 * An instance of this class is used to represent the current
 * time. It encapsulates a long variable, which is equivalent
 * to (new Date()).getTime().
 * 
 * A class is used to wrap the long just to make clearer the interfaces
 * where a reference to the current time is in use, as opposed to 
 * a particular point in time.
 *
 */
public class NowReference {
	
	static public NowReference now(){
		long nowTime = (new Date()).getTime();
		return new NowReference(nowTime);
	}
	
	private long now;
	
	public NowReference(long now){
		this.now = now;
	}
	
	public long getTime() {
		return now;
	}
}
