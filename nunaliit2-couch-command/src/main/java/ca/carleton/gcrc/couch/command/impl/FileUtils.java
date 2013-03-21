package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.command.GlobalSettings;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class FileUtils {
	
	static public Map<String,File> listDocumentsFromDir(
			GlobalSettings gs
			,File docsDir
			) throws Exception {

		Map<String,File> docIds = new HashMap<String,File>();
	
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
					
					docIds.put(doc.getId(), subDir);
				}
			}
		}
		
		return docIds;
	}

}
