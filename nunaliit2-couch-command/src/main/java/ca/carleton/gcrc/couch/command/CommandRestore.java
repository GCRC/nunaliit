package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.List;

import ca.carleton.gcrc.couch.app.DbRestoreListener;
import ca.carleton.gcrc.couch.app.DbRestoreProcess;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.command.impl.CommandSupport;
import ca.carleton.gcrc.couch.command.impl.RestoreListener;

public class CommandRestore implements Command {

	@Override
	public String getCommandString() {
		return "restore";
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
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Restore Command");
		ps.println();
		ps.println("The restore command allows a user to restore a snapshot, previously");
		ps.println("obtained using the dump command, to the database associated with the");
		ps.println("atlas.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit restore <options>");
		ps.println();
		ps.println("options:");
		ps.println("  "+Options.OPTION_DUMP_DIR+" <dir>");
		ps.println("    --dump-dir <dir>  Directory where snapshot is stored");
		ps.println();
		ps.println("  "+Options.OPTION_DOC_ID+" <docId>");
		ps.println("    Specifies which document(s) should be restored by selecting the ");
		ps.println("    document identifier. This option can be used multiple times to include");
		ps.println("    multiple documents in the restore process. If  this option is not ");
		ps.println("    used, all documents are restored.");
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

		// Pick up options
		String dumpDirStr = options.getDumpDir();
		List<String> docIds = options.getDocIds();

		File dumpDir = null;
		if( null != dumpDirStr ){
			dumpDir = new File(dumpDirStr);
		}
		if( null == dumpDir ) {
			throw new Exception("During a restore, the --dump-dir option must be provided");
		}
		if( false == dumpDir.exists() ) {
			throw new Exception("Can not find restore directory: "+dumpDir.getAbsolutePath());
		}
		
		gs.getOutStream().println("Restoring from "+dumpDir.getAbsolutePath());

		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
		CouchDb couchDb = CommandSupport.createCouchDb(gs, atlasProperties);
		
		DbRestoreListener listener = new RestoreListener(gs.getOutStream());
		
		DbRestoreProcess restoreProcess = new DbRestoreProcess(couchDb, dumpDir);
		restoreProcess.setListener(listener);
		if( docIds.size() < 1 ) {
			restoreProcess.setAllDocs(true);
		} else {
			for(String docId : docIds) {
				restoreProcess.addDocId(docId);
			}
		}
		restoreProcess.restore();
	}

}
