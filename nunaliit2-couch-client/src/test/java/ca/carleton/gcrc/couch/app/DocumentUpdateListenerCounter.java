package ca.carleton.gcrc.couch.app;

public class DocumentUpdateListenerCounter implements DocumentUpdateListener {

	private int skippedBecauseModified = 0;
	private int skippedBecauseUnchanged = 0;
	private int updatedDocument = 0;
	
	@Override
	public void documentSkippedBecauseModified(Document doc) {
		++skippedBecauseModified;
	}

	@Override
	public void updatingDocument(Phase phase, Document doc) {
		if( phase == Phase.AFTER ) {
			++updatedDocument;
		}
	}

	@Override
	public void documentSkippedBecauseUnchanged(Document doc) {
		++skippedBecauseUnchanged;
	}

	public int getSkippedBecauseModified() {
		return skippedBecauseModified;
	}

	public void setSkippedBecauseModified(int skippedBecauseModified) {
		this.skippedBecauseModified = skippedBecauseModified;
	}

	public int getUpdatedDocument() {
		return updatedDocument;
	}

	public void setUpdatedDocument(int updatedDocument) {
		this.updatedDocument = updatedDocument;
	}

	public int getSkippedBecauseUnchanged() {
		return skippedBecauseUnchanged;
	}

	public void setSkippedBecauseUnchanged(int skippedBecauseUnchanged) {
		this.skippedBecauseUnchanged = skippedBecauseUnchanged;
	}
}
