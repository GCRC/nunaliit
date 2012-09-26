package ca.carleton.gcrc.couch.app;

public interface DocumentUpdateListener {
	
	public enum Phase {
		BEFORE
		,AFTER
	};

	void documentSkippedBecauseModified(Document doc);

	void documentSkippedBecauseUnchanged(Document doc);

	void updatingDocument(Phase phase, Document doc);
}
