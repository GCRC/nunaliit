package ca.carleton.gcrc.couch.app.impl;

import java.util.List;

import ca.carleton.gcrc.couch.app.DbRestoreListener;
import ca.carleton.gcrc.couch.app.Document;

public class DbRestoreListenerNull implements DbRestoreListener {

	@Override
	public void reportDocumentIds(List<String> docIds) {
	}

	@Override
	public void endRestore() {
	}

	@Override
	public void documentSkippedBecauseModified(Document doc) {
	}

	@Override
	public void documentSkippedBecauseUnchanged(Document doc) {
	}

	@Override
	public void updatingDocument(Phase phase, Document doc) {
	}
}
