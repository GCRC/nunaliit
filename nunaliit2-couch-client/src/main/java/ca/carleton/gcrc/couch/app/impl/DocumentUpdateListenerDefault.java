package ca.carleton.gcrc.couch.app.impl;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateListener;

public class DocumentUpdateListenerDefault implements DocumentUpdateListener {

	@Override
	public void documentSkippedBecauseModified(Document doc) {
	}

	@Override
	public void updatingDocument(Phase phase, Document doc) {
	}

	@Override
	public void documentSkippedBecauseUnchanged(Document doc) {
	}
}
