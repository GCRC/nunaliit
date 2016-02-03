package ca.carleton.gcrc.couch.export.impl;

import java.util.Iterator;
import java.util.List;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;

public class DocumentRetrievalId implements DocumentRetrieval {
	
	static public DocumentRetrieval create(CouchDb couchDb, List<String> docIds) throws Exception {
		
		return new DocumentRetrievalId(couchDb, docIds);
	}

	private CouchDb couchDb;
	private Iterator<String> idIterator;
	
	private DocumentRetrievalId(CouchDb couchDb, List<String> docIds) throws Exception {
		this.couchDb = couchDb;
		this.idIterator = docIds.iterator();
	}
	
	@Override
	public boolean hasNext() {
		return idIterator.hasNext();
	}

	@Override
	public Document getNext() throws Exception {
		String docId = idIterator.next();
		DocumentCouchDb doc = DocumentCouchDb.documentFromCouchDb(couchDb, docId);
		return doc;
	}
}
