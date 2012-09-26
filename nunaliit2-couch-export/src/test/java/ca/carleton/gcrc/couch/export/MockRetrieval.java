package ca.carleton.gcrc.couch.export;

import java.util.Collection;
import java.util.Iterator;

import ca.carleton.gcrc.couch.app.Document;

public class MockRetrieval implements DocumentRetrieval {

	Iterator<Document> it;
	
	public MockRetrieval(Collection<Document> docs){
		it = docs.iterator();
	}
	
	@Override
	public boolean hasNext() {
		return it.hasNext();
	}

	@Override
	public Document getNext() throws Exception {
		return it.next();
	}

}
