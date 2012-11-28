package ca.carleton.gcrc.couch.command.dump;

import java.io.File;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

import ca.carleton.gcrc.couch.app.DbRestoreListener;
import ca.carleton.gcrc.couch.app.DbRestoreProcess;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.command.impl.RestoreListener;

public class RestoreMain {

	static public void main(String[] args) {
		DumpSettings dumpSettings = null;
		
		try {
			List<String> arguments = new ArrayList<String>(args.length);
			for(String arg : args){
				arguments.add(arg);
			}
			
			dumpSettings = new DumpSettings(DumpSettings.Type.RESTORE);
			
			RestoreMain app = new RestoreMain();
			app.execute(dumpSettings, arguments);
			System.exit(0);
			
		} catch(Exception e) {
			
			PrintStream err = System.err;
			if( null != dumpSettings ) {
				err = dumpSettings.getErrStream();
			} 
			
			if( null != dumpSettings 
			 && dumpSettings.isDebug() ){
				e.printStackTrace(err);
				
			} else {
				err.print("Error: "+e.getMessage());
				err.println();
				
				int limit = 10;
				Throwable cause = e.getCause();
				while(null != cause && limit > 0) {
					err.print("Caused by: "+cause.getMessage());
					err.println();
					cause = cause.getCause();
					--limit;
				}
			}
			
			// Error
			System.exit(1);
		}
	}
	
	public void execute(DumpSettings dumpSettings, List<String> args) throws Exception {
		
		// Turn arguments into a stack
		Stack<String> argumentStack = new Stack<String>();
		for(int i=args.size()-1; i>=0; --i){
			argumentStack.push( args.get(i) );
		}
		
		// Process global options
		dumpSettings.parseCommandLineArguments(argumentStack);
		
		// Check for help
		if( dumpSettings.isHelpRequested() ) {
			help( dumpSettings.getOutStream() );
			return;
		}
		
		// Ask the user about the missing options
		dumpSettings.acceptUserOptions();

		// Check that dump dir exists
		File dumpDir = dumpSettings.getDumpDir();
		if( null == dumpDir ) {
			throw new Exception("--dump-dir must be specified");
		}
		
		// Get CouchDb client
		CouchDb couchDb = dumpSettings.createCouchDb();
		
		// Create restore process
		DbRestoreListener listener = new RestoreListener(dumpSettings.getOutStream());
		DbRestoreProcess restoreProcess = new DbRestoreProcess(couchDb, dumpDir);
		restoreProcess.setListener(listener);
		List<String> docIds = dumpSettings.getDocIds();
		if( docIds.size() < 1 ) {
			restoreProcess.setAllDocs(true);
		} else {
			for(String docId : docIds) {
				restoreProcess.addDocId(docId);
			}
		}
		restoreProcess.restore();
	}
	
	private void help(PrintStream ps) {
		ps.println("couch-restore - Help");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  couch-restore [<option> ...]");
		ps.println();
		ps.println("This command reads documents from disk and uploads them to a CouchDb");
		ps.println("database. The documents on disk must have been previously saved using the");
		ps.println("couch-dump utility.");
		ps.println();
		ps.println("All documents found on disk can be uploaded if the --doc-id option is not");
		ps.println("specified. On the other hand, it is possible to upload a subset of the");
		ps.println("documents by specifying the --doc-id option once or multiple times.");
		ps.println();
		ps.println("<option> can be one of:");
		ps.println("--help");
		ps.println("    This option prints the help instructions.");
		ps.println();
		ps.println("--debug");
		ps.println("    This options specifies that more information is");
		ps.println("    provided during the execution.");
		ps.println();
		ps.println("--dump-dir <dir>");
		ps.println("    Directory where all documents are uploaded from.");
		ps.println();
		ps.println("--server <url>");
		ps.println("    URL to the CouchDb server.");
		ps.println();
		ps.println("--db <dbName>");
		ps.println("    Name of the database to restore documents to.");
		ps.println();
		ps.println("--user <user>");
		ps.println("    User name to be used during the restore.");
		ps.println();
		ps.println("--password <password>");
		ps.println("    Password associated with the user.");
		ps.println();
		ps.println("--doc-id <docId>");
		ps.println("    If this option is not specified, then all documents are selected.");
		ps.println("    for restore. If this option is specified once or multiple");
		ps.println("    times, then only the requested documents are selected.");
	}
}
