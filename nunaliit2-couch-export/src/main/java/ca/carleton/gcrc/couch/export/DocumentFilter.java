package ca.carleton.gcrc.couch.export;

import ca.carleton.gcrc.couch.app.Document;

public interface DocumentFilter {

	boolean accepts(Document doc) throws Exception;
}
