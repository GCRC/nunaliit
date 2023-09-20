package ca.carleton.gcrc.couch.export.impl;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;

public class DocumentRetrievalSchema implements DocumentRetrieval {

	static public DocumentRetrieval create(CouchDb couchDb, String schemaName) throws Exception {
		CouchDesignDocument dd = couchDb.getDesignDocument("atlas");
		
		CouchQuery query = new CouchQuery();
		query.setViewName("nunaliit-schema");
		query.setStartKey(schemaName);
		query.setEndKey(schemaName);
		query.setIncludeDocs(false);
		
		CouchQueryResults results = dd.performQuery(query);
		
		Set<String> ids = new HashSet<String>();
		for(JSONObject row : results.getRows()){
			String docId = row.optString("id", null);
			if( null != docId ) {
				ids.add(docId);
			}
		}
		
		return new DocumentRetrievalSchema(couchDb, ids.iterator());
	}

	
	private CouchDb couchDb;
	private Iterator<String> idIterator;
	
	private DocumentRetrievalSchema(CouchDb couchDb, Iterator<String> idIterator){
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
			throw new Exception("No more document on schema");
		}
		
		String docId = idIterator.next();
		DocumentCouchDb doc = DocumentCouchDb.documentFromCouchDb(couchDb, docId);
		
		return doc;
	}
}
