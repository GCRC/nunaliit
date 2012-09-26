package ca.carleton.gcrc.couch.app;

import java.util.List;

public interface DbRestoreListener extends DocumentUpdateListener {

	void reportDocumentIds(List<String> docIds);
	
	void endRestore();
}
