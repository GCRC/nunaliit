package ca.carleton.gcrc.couch.export.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentJSON;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;

public class DocumentRetrievalId implements DocumentRetrieval {
	
	static private int CACHE_SIZE = 25;

	static public DocumentRetrieval create(CouchDb couchDb, List<String> docIds) throws Exception {
		
		return new DocumentRetrievalId(couchDb, docIds);
	}

	private CouchDb couchDb;
	private List<String> docIds;
	private int currentIndex;
	private List<JSONObject> cachedDocs = null;
	
	private DocumentRetrievalId(CouchDb couchDb, List<String> docIds) throws Exception {
		this.couchDb = couchDb;
		this.docIds = docIds;
		currentIndex = 0;
		
		cachedDocs = new Vector<JSONObject>();
		
		loadCache();
	}
	
	private void loadCache() throws Exception {
		if( null == cachedDocs ){
			return;
		}

		if( cachedDocs.size() > 0 ){
			return;
		}
		
		boolean done = false;
		while( !done ){
			List<String> loadDocIds = new ArrayList<String>(CACHE_SIZE);
			for(int loop=0; loop<CACHE_SIZE; ++loop){
				if( currentIndex < docIds.size() )	{
					String docId = docIds.get(currentIndex);
					++currentIndex;
					loadDocIds.add(docId);
				}
			}
			
			if( loadDocIds.size() < 1 ){
				cachedDocs = null;
				return;
			}
			
			Collection<JSONObject> loadedDocs = couchDb.getDocuments(loadDocIds);
			if( loadedDocs.size() > 0 ){
				cachedDocs.addAll(loadedDocs);
				done = true;
			}
		}
	};
	
	@Override
	public boolean hasNext() {
		try {
			loadCache();
		} catch (Exception e) {
			// ignore
		}
		
		if( null == cachedDocs ){
			return false;
		}

		if( cachedDocs.size() > 0 ){
			return true;
		}
		
		return false;
	}

	@Override
	public Document getNext() throws Exception {
		loadCache();
		
		if( null == cachedDocs ){
			return null;
		}

		if( cachedDocs.size() < 1 ){
			return null;
		}
		
		JSONObject jsonDoc = cachedDocs.remove(0);
		Document doc = new DocumentJSON(jsonDoc);
		return doc;
	}
}
