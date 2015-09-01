package ca.carleton.gcrc.couch.export.impl;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.export.DocumentFilter;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;

public class DocumentRetrievalFiltered implements DocumentRetrieval {

	private DocumentRetrieval source;
	private DocumentFilter filter;
	private Document cachedDoc;
	
	public DocumentRetrievalFiltered(DocumentRetrieval source, DocumentFilter filter){
		this.source = source;
		this.filter = filter;
	}
	
	@Override
	public boolean hasNext() {
		try {
			loadCache();
		} catch (Exception e) {
			// ignore
		}
		
		if( null != cachedDoc ){
			return true;
		}
		
		return false;
	}

	@Override
	public Document getNext() throws Exception {
		loadCache();
		
		Document doc = cachedDoc;
		cachedDoc = null;
		
		return doc;
	}

	private void loadCache() throws Exception {
		if( null != cachedDoc ){
			return;
		}
		
		boolean done = false;
		while( !done ){
			Document doc = source.getNext();
			if( null == doc ){
				done = true;
			} else if( filter.accepts(doc) ){
				cachedDoc = doc;
				done = true;
			}
		}
	}
}
