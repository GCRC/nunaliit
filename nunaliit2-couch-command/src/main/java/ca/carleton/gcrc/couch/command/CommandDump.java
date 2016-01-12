package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import ca.carleton.gcrc.couch.app.DbDumpProcess;
import ca.carleton.gcrc.couch.client.CouchDb;
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
		ps.println("  nunaliit [<global-options>] dump [<dump-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Dump Options");
		ps.println("  --dump-dir <dir>   Directory where snapshot should be stored");
		ps.println();
		ps.println("  --doc-id   <docId> Specifies which document(s) should be");
		ps.println("                     dumped by selecting the document identifier.");
		ps.println("                     This option can be used multiple times to include");
		ps.println("                     multiple documents in the dump.");
		ps.println();
		ps.println("  --skeleton         Select skeleton documents for the dump process.");
		ps.println();
		ps.println("  --overwrite-docs   Dump skeleton documents in the 'docs' sub-directory");
		ps.println("                     of the atlas, over-writing the files found there.");
		ps.println("                     This option includes the --skeleton option, as well.");
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
		List<String> docIds = options.getDocIds();
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
				if( docIdToFile.containsKey(docId) ){
					dumpProcess.addDocId(docId, docIdToFile.get(docId));
				} else {
					dumpProcess.addDocId(docId);
				}
			}
		}
		dumpProcess.setListener(listener);
		dumpProcess.dump();
	}

}
