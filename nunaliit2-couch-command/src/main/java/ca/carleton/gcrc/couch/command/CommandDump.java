package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.DbDumpProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentStoreProcessImpl;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.command.impl.CommandSupport;
import ca.carleton.gcrc.couch.command.impl.DumpListener;
import ca.carleton.gcrc.couch.command.impl.FileUtils;
import ca.carleton.gcrc.couch.command.impl.SkeletonDocumentsDetector;

public class CommandDump implements Command {

	@Override
	public String getCommandString() {
		return "dump";
	}

	@Override
	public boolean matchesKeyword(String keyword) {
		if( getCommandString().equalsIgnoreCase(keyword) ) {
			return true;
		}
		return false;
	}

	@Override
	public boolean isDeprecated() {
		return false;
	}

	@Override
	public String[] getExpectedOptions() {
		return new String[]{
				Options.OPTION_ATLAS_DIR
				,Options.OPTION_DUMP_DIR
				,Options.OPTION_DOC_ID
				,Options.OPTION_SCHEMA
				,Options.OPTION_SKELETON
				,Options.OPTION_OVERWRITE_DOCS
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Dump Command");
		ps.println();
		ps.println("The dump command allows a user to take a snapshot of the");
		ps.println("CouchDb database support the atlas and storing the snapshot");
		ps.println("to disk.");
		ps.println();
		ps.println("Specific documents can be selected by using a combination of");
		ps.println("options including --doc-id and --skeleton. If the dump command");
		ps.println("is invoked without specifying any document, then all documents");
		ps.println("found in the database are dumped.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit dump <options>");
		ps.println();
		ps.println("options:");
		ps.println("  "+Options.OPTION_DUMP_DIR+" <dir>");
		ps.println("    Directory where snapshot should be stored");
		ps.println();
		ps.println("  "+Options.OPTION_DOC_ID+" <docId>");
		ps.println("    Specifies which document(s) should be dumped by selecting the ");
		ps.println("    document identifier. This option can be used multiple times");
		ps.println("    to include multiple documents in the dump.");
		ps.println();
		ps.println("  "+Options.OPTION_SCHEMA);
		ps.println("    Specifies which document(s) should be dumped by selecting the ");
		ps.println("    document's schema.");
		ps.println();
		ps.println("  "+Options.OPTION_SKELETON);
		ps.println("    Select skeleton documents for the dump process.");
		ps.println();
		ps.println("  "+Options.OPTION_OVERWRITE_DOCS);
		ps.println("    Dump skeleton documents in the 'docs' sub-directory of the atlas,");
		ps.println("    over-writing the files found there. This option includes the "+Options.OPTION_SKELETON);
		ps.println("    option, as well.");
		ps.println();
		CommandHelp.reportGlobalOptions(ps,getExpectedOptions());
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 1 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(1));
		}

		File atlasDir = gs.getAtlasDir();

		// Compute default dump dir
		File dumpDir = null;
		{
			Calendar calendar = Calendar.getInstance();
			String name = String.format(
				"dump_%04d-%02d-%02d_%02d:%02d:%02d"
				,calendar.get(Calendar.YEAR)
				,(calendar.get(Calendar.MONTH)+1)
				,calendar.get(Calendar.DAY_OF_MONTH)
				,calendar.get(Calendar.HOUR_OF_DAY)
				,calendar.get(Calendar.MINUTE)
				,calendar.get(Calendar.SECOND)
				);
			dumpDir = new File(atlasDir, "dump/"+name);
		}
		
		// Pick up options
		Set<String> docIds = options.getDocIds();
		Set<String> schemaNames = options.getSchemaNames();
		boolean selectSkeletonDocuments = false;
		if( null != options.getSkeleton() ){
			selectSkeletonDocuments = options.getSkeleton().booleanValue();
		}
		boolean overwriteDocs = false;
		if( null != options.getOverwriteDocs() ){
			overwriteDocs = options.getOverwriteDocs().booleanValue();
		}
		if( null != options.getDumpDir() ){
			String dumpDirStr = options.getDumpDir();
			dumpDir = new File( dumpDirStr );
		}
		
		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
		CouchDb couchDb = CommandSupport.createCouchDb(gs, atlasProperties);

		// Assume --skeleton if --overwrite-docs is specified, unless --doc-id
		// is provided
		if( overwriteDocs && docIds.size() < 1 ){
			selectSkeletonDocuments = true;
		}
		
		if( selectSkeletonDocuments ){
			SkeletonDocumentsDetector docFinder = new SkeletonDocumentsDetector(couchDb,gs);
			for(String docId : docFinder.getSkeletonDocIds()){
				if( couchDb.documentExists(docId) ){
					docIds.add(docId);
				} else {
					gs.getOutStream().println("Skeleton document "+docId+" has been removed from the database");
				}
			}
		}
		
		// If the user has provided schema names, we need to find the doc identifiers for
		// those documents
		if( schemaNames.size() > 0 ){
			CouchDesignDocument designDoc = couchDb.getDesignDocument("atlas");
			CouchQuery query = new CouchQuery();
			query.setViewName("nunaliit-schema");
			query.setKeys( new ArrayList<String>(schemaNames) );
			CouchQueryResults results = designDoc.performQuery(query);
			List<JSONObject> rows = results.getRows();
			for(JSONObject row : rows){
				String docId = row.getString("id");
				docIds.add(docId);
			}
		};
		
		// Create a map of all documents on disk, so that we can predict where to 
		// save specific docIds
		Map<String,File> docIdToFile = new HashMap<String,File>();
		if( overwriteDocs ){
			dumpDir = new File(atlasDir, "docs");
			docIdToFile = FileUtils.listDocumentsFromDir(gs, dumpDir);
		}
		
		gs.getOutStream().println("Dumping to "+dumpDir.getAbsolutePath());
		
		DumpListener listener = new DumpListener( gs.getOutStream() );
		
		DbDumpProcess dumpProcess = new DbDumpProcess(couchDb, dumpDir);
		if( docIds.size() < 1 && false == selectSkeletonDocuments ) {
			dumpProcess.setAllDocs(true);
		} else {
			for(String docId : docIds) {
				// Do we know where to store this docId?
				if( docIdToFile.containsKey(docId) ){
					// Yes!
					dumpProcess.addDocId(docId, docIdToFile.get(docId));
				} else {
					dumpProcess.addDocId(docId);
				}
			}
		}
		if( overwriteDocs ){
			// When overwriting documents, the documents are meant for
			// source repository. Do not store created and updated timestamp
			DocumentStoreProcessImpl storeProcess = new DocumentStoreProcessImpl();
			storeProcess.addKeyToIgnore("nunaliit_created");
			storeProcess.addKeyToIgnore("nunaliit_last_updated");
			dumpProcess.setStoreProcess(storeProcess);
		}
		dumpProcess.setListener(listener);
		dumpProcess.dump();
	}

}
