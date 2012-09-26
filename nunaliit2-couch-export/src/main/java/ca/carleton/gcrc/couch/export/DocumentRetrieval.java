package ca.carleton.gcrc.couch.export;

import ca.carleton.gcrc.couch.app.Document;

public interface DocumentRetrieval {

	boolean hasNext();
	
	Document getNext() throws Exception;
}
