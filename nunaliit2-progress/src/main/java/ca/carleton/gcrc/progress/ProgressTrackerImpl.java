package ca.carleton.gcrc.progress;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Class that tracks all progress information. It tracks activities 
 * based on identifiers. Activities have a description, a total count 
 * and a current count. 
 * <br/>
 * The complexity of this class stems from the fact that memory should not be 
 * leaked. Therefore, two settings are used to clean the cache:<ol>
 * <li>Elapsed time since last request for an activity (lastRequestFlushInMs)</li>
 * <li>Maximum number of tracked activities (maxConcurrentActivities)</li>
 * </ol>
 *
 */
public class ProgressTrackerImpl implements ProgressTracker {
	/**
	 * Default number of milliseconds that an activity is
	 * tracked after the last request for its value.
	 */
	static final long LAST_REQUEST_FLUSH_IN_MS = 5 * 60 * 1000; // 5 minutes
	
	/**
	 * Maximum number of concurrent activities tracked at once.
	 */
	static final long MAX_CONCURRENT_ACTIVITIES = 1000; // at most a 1000 activities

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private long count = 0;
	private Map<String,ProgressInfo> infoMap = new HashMap<String,ProgressInfo>();
	private List<ProgressInfo> infoOrderedLastAccess = new Vector<ProgressInfo>();
	private long lastRequestFlushInMs;
	private long maxConcurrentActivities;
	
	public ProgressTrackerImpl() {
		lastRequestFlushInMs = LAST_REQUEST_FLUSH_IN_MS;
		maxConcurrentActivities = MAX_CONCURRENT_ACTIVITIES;
	}

	public synchronized long getLastRequestFlushInMs() {
		return lastRequestFlushInMs;
	}

	public synchronized void setLastRequestFlushInMs(long lastRequestFlushInMs) {
		this.lastRequestFlushInMs = lastRequestFlushInMs;
	}

	public synchronized long getMaxConcurrentActivities() {
		return maxConcurrentActivities;
	}

	public synchronized void setMaxConcurrentActivities(long maxConcurrentActivities) {
		this.maxConcurrentActivities = maxConcurrentActivities;
	}
	
	@Override
	synchronized public String createIdentifier() {
		String result = "progress"+count;
		++count;
		
		logger.debug("createIdentifier: "+result);
		
		return result;
	}

	@Override
	public void initProgress(String identifier, String description, long totalCount) {
		ProgressInfo info = getProgressInfoFromId(identifier);

		logger.debug("initProgress: "+identifier+" "+description+" total: "+totalCount);
		
		synchronized(info) {
			info.setDescription(description);
			info.setTotalCount(totalCount);
		}
	}

	@Override
	public void updateProgress(String identifier, long currentCount) {
		ProgressInfo info = getProgressInfoFromId(identifier);

		logger.debug("updateProgress: "+identifier+" current: "+currentCount);
		
		synchronized(info) {
			info.setCurrentCount(currentCount);
		}
	}

	@Override
	public void updateProgressData(String identifier, Map<String,String> data) {
		ProgressInfo info = getProgressInfoFromId(identifier);

		logger.debug("updateProgressData: "+identifier);
		
		synchronized(info) {
			info.setData(data);
		}
	}
	
	@Override
	public void addProgressChain(String identifier, ProgressInfo chainedActivity) {
		ProgressInfo info = getProgressInfoFromId(identifier);

		logger.debug("addProgressChain: "+identifier+" -> "+chainedActivity.getIdentifier());
		
		synchronized(info) {
			info.addChainedActivity(chainedActivity);
		}
	}
	
	@Override
	public void completeProgress(String identifier, String errorMessage) {
		ProgressInfo info = getProgressInfoFromId(identifier);

		logger.debug("completeProgress: "+identifier+" error msg: "+errorMessage);
		
		synchronized(info) {
			info.setCompleted(true);
			info.setErrorMessage(errorMessage);
			
			// If no error, bump up count to 100%
			if( null == errorMessage ) {
				info.setCurrentCount( info.getTotalCount() );
			}
		}
	}

	synchronized private ProgressInfo getProgressInfoFromId(String identifier) {
		ProgressInfo info = infoMap.get(identifier);
		if( null == info ) {
			info = new ProgressInfo(identifier);
			infoMap.put(identifier, info);
			infoOrderedLastAccess.add(info);
			
			// Do not cross max
			if( maxConcurrentActivities > 0 ) {
				while( infoOrderedLastAccess.size() > maxConcurrentActivities ) {
					ProgressInfo infoToDelete = infoOrderedLastAccess.get(0);
					deleteInfo(infoToDelete);
				}
			}
		}
		return info;
	}

	@Override
	public ProgressInfo getProgress(String identifier) {
		ProgressInfo info = getProgressInfoFromId(identifier);

		Date current = new Date();
		
		synchronized(info) {
			info.setLastRequested(current);
		}

		// Move to back of list
		synchronized(this) {
			infoOrderedLastAccess.remove(info);
			infoOrderedLastAccess.add(info);

			cleanInfo(current);
		}
		
		return info;
	}
	
	synchronized private void deleteInfo(ProgressInfo info) {
		infoMap.remove(info.getIdentifier());
		infoOrderedLastAccess.remove(info);
	}

	synchronized private void cleanInfo(Date currentDate) {
		if( lastRequestFlushInMs <= 0 ) {
			return;
		}
		
		long currentTimeInMs = currentDate.getTime();
		
		while( infoOrderedLastAccess.size() > 0 ) {
			ProgressInfo info = infoOrderedLastAccess.get(0);
			long lastRequestTimeInMs = info.getLastRequested().getTime();
			if( (currentTimeInMs - lastRequestTimeInMs) > lastRequestFlushInMs ) {
				deleteInfo(info);
			} else {
				return;
			}
		}
	}
}
