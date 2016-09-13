package ca.carleton.gcrc.couch.command.dump;

import java.io.File;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

import ca.carleton.gcrc.couch.app.DbDumpProcess;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.command.impl.DumpListener;

public class DumpMain {

	static public void main(String[] args) {
		DumpSettings dumpSettings = null;
		
		try {
			List<String> arguments = new ArrayList<String>(args.length);
			for(String arg : args){
				arguments.add(arg);
			}
			
			dumpSettings = new DumpSettings(DumpSettings.Type.DUMP);
			
			DumpMain app = new DumpMain();
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
		
		// Create dump process
		DumpListener listener = new DumpListener( dumpSettings.getOutStream() );
		DbDumpProcess dumpProcess = new DbDumpProcess(couchDb, dumpDir);
		List<String> docIds = dumpSettings.getDocIds();
		String schemaName = dumpSettings.getSchema();
		if( docIds.size() < 1 ) {
			dumpProcess.setAllDocs(true);
		} else if( null != schemaName ) {
			dumpProcess.setSchema(schemaName);
			
		} else {
			for(String docId : docIds) {
				dumpProcess.addDocId(docId);
			}
		}
		dumpProcess.setListener(listener);
		dumpProcess.dump();
	}
	
	private void help(PrintStream ps) {
		ps.println("couch-dump - Help");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  couch-dump [<option> ...]");
		ps.println();
		ps.println("This command extracts documents from a CouchDb database and");
		ps.println("saves them to disk. The complete database can be dumped if");
		ps.println("the --doc-id option is not specified. On the other hand, it is");
		ps.println("possible to dump a subset of the documents by specifying the");
		ps.println("--doc-id option once or multiple times.");
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
		ps.println("    Directory where all documents are dumped to.");
		ps.println();
		ps.println("--schema <schemaName>");
		ps.println("    This option dumps all documents with a specified schema.");
		ps.println();
		ps.println("--server <url>");
		ps.println("    URL to the CouchDb server.");
		ps.println();
		ps.println("--db <dbName>");
		ps.println("    Name of the database to dump or restore.");
		ps.println();
		ps.println("--user <user>");
		ps.println("    User name to be used during the dump or restore.");
		ps.println();
		ps.println("--password <password>");
		ps.println("    Password associated with the user.");
		ps.println();
		ps.println("--doc-id <docId>");
		ps.println("    If this option is not specified, then all documents are selected.");
		ps.println("    for dump or restore. If this option is specified once or multiple");
		ps.println("    times, then only the requested documents are selected.");
	}
}
