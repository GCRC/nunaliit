package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.Calendar;
import java.util.Stack;

import ca.carleton.gcrc.couch.app.DbDumpProcess;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.command.impl.CommandSupport;
import ca.carleton.gcrc.couch.command.impl.DumpListener;
import ca.carleton.gcrc.couch.command.website.WebsiteDumpProcess;

public class CommandStatic implements Command {

	@Override
	public String getCommandString() {
		return "static";
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
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Static Website Command");
		ps.println();
		ps.println("The static command creates a set of files that can be used to set");
		ps.println("up a static website using a snapshot of the documents currently in");
		ps.println("the database.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] static [<static-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Static Options");
		ps.println("  --dump-dir <dir>   Directory where web-site should be stored");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {

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
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--dump-dir".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--dump-dir option requires a directory");
				}
				
				String dumpDirStr = argumentStack.pop();
				dumpDir = new File(dumpDirStr);

			} else {
				break;
			}
		}
		
		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
		CouchDb couchDb = CommandSupport.createCouchDb(gs, atlasProperties);
		
		gs.getOutStream().println("Creating static web-site to "+dumpDir.getAbsolutePath());
		
		DumpListener listener = new DumpListener( gs.getOutStream() );
		
		WebsiteDumpProcess dumpProcess = new WebsiteDumpProcess();
		dumpProcess.setAtlasDir(atlasDir);
		dumpProcess.setDumpDir(dumpDir);
		dumpProcess.dump();
	}

}
