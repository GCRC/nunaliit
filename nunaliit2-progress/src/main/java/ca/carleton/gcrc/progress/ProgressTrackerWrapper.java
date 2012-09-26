package ca.carleton.gcrc.progress;

import java.util.Map;

public class ProgressTrackerWrapper implements ProgressTracker {

	private ProgressTracker wrapped;

	public ProgressTrackerWrapper() {
	}

	public ProgressTrackerWrapper(ProgressTracker wrapped) {
		this.wrapped = wrapped;
	}
	
	public ProgressTracker getWrapped() {
		return wrapped;
	}

	public void setWrapped(ProgressTracker wrapped) {
		this.wrapped = wrapped;
	}
	
	@Override
	public String createIdentifier() {
		return wrapped.createIdentifier();
	}

	@Override
	public void initProgress(
		String identifier
		,String description
		,long totalCount
		) {
		wrapped.initProgress(identifier, description, totalCount);
	}

	@Override
	public void updateProgress(String identifier, long currentCount) {
		wrapped.updateProgress(identifier, currentCount);
	}

	@Override
	public void updateProgressData(String identifier, Map<String, String> data) {
		wrapped.updateProgressData(identifier, data);
	}

	@Override
	public void addProgressChain(String identifier, ProgressInfo chainedActivity) {
		wrapped.addProgressChain(identifier, chainedActivity);
	}

	@Override
	public void completeProgress(String identifier, String errorMessage) {
		wrapped.completeProgress(identifier, errorMessage);
	}

	@Override
	public ProgressInfo getProgress(String identifier) {
		return wrapped.getProgress(identifier);
	}

}
