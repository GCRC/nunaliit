package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import ca.carleton.gcrc.couch.app.impl.DbDumpListenerNull;
import ca.carleton.gcrc.couch.app.impl.DocumentCouchDb;
import ca.carleton.gcrc.couch.client.CouchDb;

public class DbDumpProcess {

	private CouchDb couchDb = null;
	private File dumpDir = null;
	private DocumentStoreProcess storeProcess = new DocumentStoreProcess();
	private boolean allDocs = false;
	private Map<String,File> docIdsToFile = new HashMap<String,File>();
	private DbDumpListener listener = new DbDumpListenerNull();
	
	public DbDumpProcess(CouchDb couchDb, File dumpDir){
		this.couchDb = couchDb;
		this.dumpDir = dumpDir;
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

	public List<String> getDocIds() {
		return new ArrayList<String>( docIdsToFile.keySet() );
	}

	public void addDocId(String docId) {
		docIdsToFile.put(docId,null);
	}

	public void addDocId(String docId, File dumpDocDir) {
		docIdsToFile.put(docId,dumpDocDir);
	}

	public DocumentStoreProcess getStoreProcess() {
		return storeProcess;
	}

	public void setStoreProcess(DocumentStoreProcess storeProcess) {
		this.storeProcess = storeProcess;
	}

	public DbDumpListener getListener() {
		return listener;
	}

	public void setListener(DbDumpListener listener) {
		this.listener = listener;
	}

	public void dump() throws Exception {
		if( null == couchDb ) {
			throw new Exception("On database dump, a database must be specified.");
		}
		if( null == dumpDir ) {
			throw new Exception("On database dump, a target directory must be specified.");
		}
		if( null == storeProcess ){
			throw new Exception("On database dump, a store process is required.");
		}
		
		// Compute docIds
		List<String> docIds = computeDocIds();
		listener.reportDocumentIds(docIds);
		
		if( docIds.size() > 0 ){
			// Create dump directory
			if( false == dumpDir.exists() ) {
				createDir(dumpDir);
			}
			
			// For each document, dump to disk
			for(String docId : docIds){
				// Compute directory location
				File docDir = null;
				{
					if( docIdsToFile.containsKey(docId) ){
						docDir = docIdsToFile.get(docId);
					}
					
					if( null == docDir ) {
						String name = computeNameFromId(docId);
						docDir = new File(dumpDir, name);
					}
				}
				
				
				// Create directory for this document
				if( docDir.exists() ) {
					emptyDir(docDir);
				} else {
					createDir(docDir);
				}
				
				// Fetch document from database
				listener.reportDownload(docId);
				Document doc = DocumentCouchDb.documentFromCouchDb(couchDb, docId);
				
				// Dump
				listener.reportStore(docId);
				storeProcess.store(doc, docDir);
			}
		}
		
		listener.reportEnd();
	}
	
	private List<String> computeDocIds() throws Exception {
		if( allDocs ) {
			// Get all documents from database
			Collection<String> allDocIds = couchDb.getAllDocIds();
			return new ArrayList<String>(allDocIds);
			
		} else {
			return getDocIds();
		}
	}
	
	private void createDir(File dir) throws Exception {
		boolean created = false;
		try {
			created = dir.mkdirs();
			
		} catch(Exception e) {
			throw new Exception("Unable to create directory: "+dir.getAbsolutePath(), e);
		}
		
		if( !created ){
			throw new Exception("Unable to create directory: "+dir.getAbsolutePath());
		}
	}
	
	private void emptyDir(File dir) throws Exception {
		String[] fileNames = dir.list();
		if( null != fileNames ) {
			for(String fileName : fileNames){
				if( fileName.charAt(0) == '.' ) {
					// ignore
				} else {
					File file = new File(dir,fileName);
					if( file.isDirectory() ) {
						emptyDir(file);
					}
					boolean deleted = false;
					try {
						deleted = file.delete();
					} catch(Exception e) {
						throw new Exception("Unable to delete: "+file.getAbsolutePath(),e);
					}
					if( !deleted ){
						throw new Exception("Unable to delete: "+file.getAbsolutePath());
					}
				}
			}
		}
	}
	
	private String computeNameFromId(String id) {
		StringBuilder sb = new StringBuilder();
		
		for(int i=0,e=id.length(); i<e; ++i){
			char c = id.charAt(i);
			
			if( '.' == c ) sb.append(c);
			else if( '_' == c ) sb.append(c);
			else if( c >= 'a' && c <= 'z' ) sb.append(c);
			else if( c >= 'A' && c <= 'Z' ) sb.append(c);
			else if( c >= '0' && c <= '9' ) sb.append(c);
			else {
				int v = (int)c;
				String s = String.format("$%02x", v);
				sb.append(s);
			}
		}
		
		return sb.toString();
	}
}
