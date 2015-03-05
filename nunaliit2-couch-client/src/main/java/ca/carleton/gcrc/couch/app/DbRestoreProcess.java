package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import ca.carleton.gcrc.couch.app.impl.DbRestoreListenerNull;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class DbRestoreProcess {

	private CouchDb couchDb = null;
	private File dumpDir = null;
	private DbRestoreListener listener = new DbRestoreListenerNull();
	private boolean allDocs = false;
	private Set<String> docIds = new HashSet<String>();

	public DbRestoreProcess(CouchDb couchDb, File dumpDir) throws Exception {
		this.couchDb = couchDb;
		this.dumpDir = dumpDir;
	}

	public DbRestoreListener getListener() {
		return listener;
	}

	public void setListener(DbRestoreListener listener) {
		this.listener = listener;
	}

	public CouchDb getCouchDb() {
		return couchDb;
	}

	public File getDumpDir() {
		return dumpDir;
	}

	public boolean isAllDocs() {
		return allDocs;
	}

	public void setAllDocs(boolean allDocs) {
		this.allDocs = allDocs;
	}

	public Collection<String> getDocIds() {
		return docIds;
	}

	public void addDocId(String docId) {
		docIds.add(docId);
	}

	public void restore() throws Exception {
		if( null == couchDb ) {
			throw new Exception("On database restore, a database must be specified.");
		}
		if( null == dumpDir ) {
			throw new Exception("On database restore, a target directory must be specified.");
		}
		if( false == dumpDir.exists() ){
			throw new Exception("On database restore, the target directory must exist.");
		}

		DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
		updateProcess.setListener(listener);
		
		Map<String,FSEntry> documentsToRestore = computeDocIds();
		
		// Sort so that design documents are at the end
		List<String> docIds = new ArrayList<String>( documentsToRestore.keySet() );
		Collections.sort(docIds, new Comparator<String>(){

			@Override
			public int compare(String docId1, String docId2) {
				boolean doc1IsDesign = docId1.startsWith("_design/");
				boolean doc2IsDesign = docId2.startsWith("_design/");
				
				if( doc1IsDesign && doc2IsDesign ) {
					return 0;
				}

				if( doc1IsDesign ) {
					return 1;
				}

				if( doc2IsDesign ) {
					return -1;
				}

				return 0;
			}
			
		});
		
		listener.reportDocumentIds(docIds);

		// Perform document updates
		for(String docId : docIds){
			FSEntry entry = documentsToRestore.get(docId);
			
			Document doc = null;
			try {
				doc = DocumentFile.createDocument(entry);
				
			} catch (Exception e) {
				throw new Exception("Unable to load document from dump: "+docId, e);
			}
			
			try {
				updateProcess.update(doc);
				
			} catch (Exception e) {
				throw new Exception("Unable to update document to database: "+docId, e);
			}
		}
		
		listener.endRestore();
	}

	private Map<String, FSEntry> computeDocIds() throws Exception {
		HashMap<String, FSEntry> map = new HashMap<String, FSEntry>();
		
		FSEntryFile topDir = new FSEntryFile(dumpDir);
		for(FSEntry entry : topDir.getChildren()) {
			try {
				Document doc = DocumentFile.createDocument(entry);
				String docId = doc.getId();
				
				if( null == docId ){
					throw new Exception("Document does not specify an identifier");
				};

				boolean shouldBeIncluded = false;
				if( allDocs ) {
					shouldBeIncluded = true;
				} else if( docIds.contains(docId) ) {
					shouldBeIncluded = true;
				}

				if( shouldBeIncluded ) {
					if( map.containsKey(docId) ){
						throw new Exception("Document id ("+docId+") already found in: "+map.get(docId).getName());
					}
					
					map.put(docId, entry);
				}
				
			} catch(Exception e) {
				throw new Exception("Error loading document at: "+entry.getName());
			}
			
		}
		
		return map;
	}
}
