package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.List;
import java.util.Stack;
import java.util.Vector;

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
		ps.println("  nunaliit [<global-options>] restore [<restore-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Restore Options");
		ps.println("  --dump-dir <dir>  Directory where snapshot is stored");
		ps.println("  --doc-id   <docId> Specifies which document(s) should be");
		ps.println("                     restored by selecting the document identifier.");
		ps.println("                     This option can be used multiple times to include");
		ps.println("                     multiple documents in the restore process. If ");
		ps.println("                     this option is not used, all documents are");
		ps.println("                     restored.");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {

		File atlasDir = gs.getAtlasDir();

		// Pick up options
		File dumpDir = null;
		List<String> docIds = new Vector<String>();
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--dump-dir".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--dump-dir option requires a directory");
				}
				
				String dumpDirStr = argumentStack.pop();
				dumpDir = new File(atlasDir, "dump/"+dumpDirStr);
				if( false == dumpDir.exists() ) {
					dumpDir = new File(dumpDirStr);
				}
				
			} else if( "--doc-id".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--doc-id option requires a document identifier");
				}
				
				String docId = argumentStack.pop();
				docIds.add(docId);
				
			} else {
				break;
			}
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
