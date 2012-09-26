package ca.carleton.gcrc.couch.app;

import java.util.List;

public interface DbDumpListener {

	void reportDocumentIds(List<String> docIds);

	void reportDownload(String docId);

	void reportStore(String docId);

	void reportEnd();

}
