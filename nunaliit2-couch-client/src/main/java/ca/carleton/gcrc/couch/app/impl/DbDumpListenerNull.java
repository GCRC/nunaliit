package ca.carleton.gcrc.couch.app.impl;

import java.util.List;

import ca.carleton.gcrc.couch.app.DbDumpListener;

public class DbDumpListenerNull implements DbDumpListener {

	@Override
	public void reportDocumentIds(List<String> docIds) {
	}

	@Override
	public void reportDownload(String docId) {
	}

	@Override
	public void reportStore(String docId) {
	}

	@Override
	public void reportEnd() {
	}

}
