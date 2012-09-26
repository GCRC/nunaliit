package ca.carleton.gcrc.couch.export.impl;

import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;

public class DocumentRetrievalId implements DocumentRetrieval {

	static public DocumentRetrieval create(CouchDb couchDb, List<String> docIds) throws Exception {
		
		Set<String> ids = new HashSet<String>();
		for(String docId : docIds){
			if( couchDb.documentExists(docId) ) {
				ids.add(docId);
			} else {
				throw new Exception("Can not find document with id: "+docId);
			}
		}
		
		return new DocumentRetrievalId(couchDb, ids.iterator());
	}

	private CouchDb couchDb;
	private Iterator<String> idIterator;
	
	private DocumentRetrievalId(CouchDb couchDb, Iterator<String> idIterator){
		this.couchDb = couchDb;
		this.idIterator = idIterator;
	}
	
	@Override
	public boolean hasNext() {
		return idIterator.hasNext();
	}

	@Override
	public Document getNext() throws Exception {
		if( false == idIterator.hasNext() ) {
			throw new Exception("No more document on list of docIds");
		}
		
		String docId = idIterator.next();
		DocumentCouchDb doc = DocumentCouchDb.documentFromCouchDb(couchDb, docId);
		
		return doc;
	}
}
