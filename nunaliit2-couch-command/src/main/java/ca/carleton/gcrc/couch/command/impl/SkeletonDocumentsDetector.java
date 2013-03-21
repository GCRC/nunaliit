package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.command.GlobalSettings;

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
			logger.debug("Obtain list of documents in 'docs'");
			File atlasDir = gs.getAtlasDir();
			File docsDir = new File(atlasDir, "docs");
			Collection<String> skeletonDocIds = listDocumentsFromDir(gs,docsDir);
			docIds.addAll(skeletonDocIds);
		}
		
		// Add all schemas
		{
			logger.debug("Obtain list of all schemas");
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
			logger.debug("Obtain list of all modules");
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
		logger.debug("Remove list of documents provided by Nunaliit");
		{
			File docsDir = PathComputer.computeInitializeDocsDir(gs.getInstallDir());
			Collection<String> nunaliitDocIds = listDocumentsFromDir(gs,docsDir);
			docIds.removeAll(nunaliitDocIds);
		}
		{
			File docsDir = PathComputer.computeUpdateDocsDir(gs.getInstallDir());
			Collection<String> nunaliitDocIds = listDocumentsFromDir(gs,docsDir);
			docIds.removeAll(nunaliitDocIds);
		}
		
		return new Vector<String>(docIds);
	}

	private Collection<String> listDocumentsFromDir(
			GlobalSettings gs
			,File docsDir
			) throws Exception {
		
		Map<String,File> docIdsToFiles = FileUtils.listDocumentsFromDir(gs, docsDir);
		return docIdsToFiles.keySet();
	}
}
