package ca.carleton.gcrc.couch.app;

import java.io.File;

public interface DocumentStoreProcess {
	
	/**
	 * Takes a document and stores it to disk.
	 * @param doc Document that should be stored to disk
	 * @param dir Location where document should be stored.
	 * @throws Exception
	 */
	void store(Document doc, File dir) throws Exception;
}
