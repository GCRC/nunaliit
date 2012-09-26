package ca.carleton.gcrc.progress;

import java.util.Map;

public class ProgressTrackerNull implements ProgressTracker {

	private int nextId = 0;
	
	@Override
	public String createIdentifier() {
		String id = "dummyTracker_"+nextId;
		++nextId;
		return id;
	}

	@Override
	public void initProgress(String identifier, String description, long totalCount) {
	}

	@Override
	public void updateProgress(String identifier, long currentCount) {
	}

	@Override
	public void updateProgressData(String identifier, Map<String, String> data) {
	}

	@Override
	public void addProgressChain(String identifier, ProgressInfo chainedActivity) {
	}

	@Override
	public void completeProgress(String identifier, String errorMessage) {
	}

	@Override
	public ProgressInfo getProgress(String identifier) {
		return new ProgressInfo(identifier);
	}
}
