package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.command.GlobalSettings;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class SkeletonDocumentsDetector {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private GlobalSettings gs;
	private CouchDb couchDb;
	
	public SkeletonDocumentsDetector(
		CouchDb couchDb
		,GlobalSettings gs
		){
		this.couchDb = couchDb;
		this.gs = gs;
	}
	
	public List<String> getSkeletonDocIds() throws Exception {
		Set<String> docIds = new HashSet<String>();
		
		// Add all documents in "docs" directory
		{
			logger.error("Obtain list of documents in 'docs'");
			File atlasDir = gs.getAtlasDir();
			File docsDir = new File(atlasDir, "docs");
			List<String> skeletonDocIds = listDocumentsFromDir(gs,docsDir);
			docIds.addAll(skeletonDocIds);
		}
		
		// Add all schemas
		{
			logger.error("Obtain list of all schemas");
			CouchDesignDocument designDoc = couchDb.getDesignDocument("atlas");
			CouchQuery query = new CouchQuery();
			query.setViewName("schemas");
			CouchQueryResults results = designDoc.performQuery(query);
			List<JSONObject> rows = results.getRows();
			for(JSONObject row : rows){
				String docId = row.getString("id");
				docIds.add(docId);
			}
		}
		
		// Add all modules
		{
			logger.error("Obtain list of all modules");
			CouchDesignDocument designDoc = couchDb.getDesignDocument("atlas");
			CouchQuery query = new CouchQuery();
			query.setViewName("modules");
			CouchQueryResults results = designDoc.performQuery(query);
			List<JSONObject> rows = results.getRows();
			for(JSONObject row : rows){
				String docId = row.getString("id");
				docIds.add(docId);
			}
		}
		
		// Remove documents provided by nunaliit
		logger.error("Remove list of documents provided by Nunaliit");
		{
			File docsDir = PathComputer.computeInitializeDocsDir(gs.getInstallDir());
			List<String> nunaliitDocIds = listDocumentsFromDir(gs,docsDir);
			docIds.removeAll(nunaliitDocIds);
		}
		{
			File docsDir = PathComputer.computeUpdateDocsDir(gs.getInstallDir());
			List<String> nunaliitDocIds = listDocumentsFromDir(gs,docsDir);
			docIds.removeAll(nunaliitDocIds);
		}
		
		return new Vector<String>(docIds);
	}

	private List<String> listDocumentsFromDir(
			GlobalSettings gs
			,File docsDir
			) throws Exception {

		List<String> docIds = new Vector<String>();
	
		if( docsDir.exists() && docsDir.isDirectory() ){
			// Iterate over each subdirectory, attempting to
			// load each document
			String[] subDirNames = docsDir.list( gs.getFilenameFilter() );
			for(String subDirName : subDirNames){
				File subDir = new File(docsDir, subDirName);
				if( subDir.exists() && subDir.isDirectory() ) {
					// OK, let's create a document based on this
					Document doc = null;
					try {
						FSEntryFile entry = new FSEntryFile(subDir);
						doc = DocumentFile.createDocument(entry);
					} catch(Exception e){
						throw new Exception("Unable to read document at: "+subDir.getName(), e);
					}
					
					docIds.add( doc.getId() );
				}
			}
		}
		
		return docIds;
	}
}
