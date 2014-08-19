package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.Calendar;
import java.util.Stack;

import ca.carleton.gcrc.couch.command.impl.GenerateCssLibrariesProcess;
import ca.carleton.gcrc.couch.command.impl.GenerateJavascriptLibrariesProcess;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.command.website.WebsiteDumpProcess;

public class CommandWebSite implements Command {

	@Override
	public String getCommandString() {
		return "website";
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
		ps.println("Nunaliit2 Atlas Framework - Website Command");
		ps.println();
		ps.println("EXPERIMENTAL - Do not use this command on a production system");
		ps.println();
		ps.println("The website command creates a set of files that can be used to set");
		ps.println("up a static website using a snapshot of the documents currently in");
		ps.println("the database. The generated website provides only a subset of the");
		ps.println("functions available in the full atlas.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] website [<website-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Website Options");
		ps.println("  --dump-dir <dir>   Directory where web-site should be stored");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {

		File atlasDir = gs.getAtlasDir();
		File installDir = gs.getInstallDir();

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

		// Update Javascript libraries and CSS libraries, if in development mode
		{
			File nunaliitDir = PathComputer.computeNunaliitDir(installDir);
			if( null != nunaliitDir ) {
				GenerateJavascriptLibrariesProcess jsProcess = new GenerateJavascriptLibrariesProcess();
				jsProcess.generate(nunaliitDir);
				
				GenerateCssLibrariesProcess cssProcess = new GenerateCssLibrariesProcess();
				cssProcess.generate(nunaliitDir);
			}
		}
		
		
		// Load properties for atlas
//		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
//		CouchDb couchDb = CommandSupport.createCouchDb(gs, atlasProperties);
		
		gs.getOutStream().println("Creating static web-site to "+dumpDir.getAbsolutePath());
		
		WebsiteDumpProcess dumpProcess = new WebsiteDumpProcess();
		dumpProcess.setAtlasDir(atlasDir);
		dumpProcess.setDumpDir(dumpDir);
		dumpProcess.setInstallDir(installDir);
		dumpProcess.dump();
	}

}
