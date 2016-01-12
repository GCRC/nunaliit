package ca.carleton.gcrc.couch.command;

import java.io.PrintStream;

public class CommandHelp implements Command {

	static public void reportGlobalSettingAtlasDir(PrintStream ps){
		ps.println("     --atlas-dir <dir>  Indicates the location of the atlas directory.");
		ps.println("                        If this option is not specified, the current");
		ps.println("                        directory is assumed to be the atlas directory.");
	}
	
	@Override
	public String getCommandString() {
		return "help";
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
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return false;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Help Command");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit help [<command-name>]");
		ps.println();
		ps.println("  nunaliit help");
		ps.println("    Provides general help.");
		ps.println();
		ps.println("  nunaliit help <command-name>");
		ps.println("    Provides specific information about a command.");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 2 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(2));
		}
		
		if( options.getArguments().size() > 1 ) {
			String commandName = options.getArguments().get(1);
			for(Command command : Main.getCommands()){
				if( command.matchesKeyword(commandName) ){
					reportCommandSpecificHelp(gs, command);
					return;
				}
			}
			
			throw new Exception("Unrecognized command: "+commandName);
		}
		
		reportGeneralHelp(gs);
	}

	private void reportGeneralHelp(GlobalSettings gs){
		gs.getOutStream().println("Nunaliit2 Atlas Framework");
		gs.getOutStream().println();
		gs.getOutStream().println("Nunaliit2 is a framework that creates atlases that");
		gs.getOutStream().println("are published on-line. A user of the framework creates");
		gs.getOutStream().println("a new atlas with the 'create' command. The create");
		gs.getOutStream().println("command builds a directory structure that can be edited");
		gs.getOutStream().println("to customize the atlas. A CouchDB is updated with the");
		gs.getOutStream().println("content of the framework with the 'update' command. Finally,");
		gs.getOutStream().println("the 'run' command opens a socket and allows access to the");
		gs.getOutStream().println("atlas via a browser.");
		gs.getOutStream().println();
		gs.getOutStream().println("Command Syntax:");
		gs.getOutStream().println("  nunaliit [<global-options>] <command> [<command-specific-options>]");
		gs.getOutStream().println();
		gs.getOutStream().println("For more information about a command:");
		gs.getOutStream().println("  nunaliit help <command-name>");
		gs.getOutStream().println();
		gs.getOutStream().println("Possible commands:");
		for(Command command : Main.getCommands()){
			if( false == command.isDeprecated() ) {
				gs.getOutStream().println("\t"+command.getCommandString());
			}
		}
	}

	private void reportCommandSpecificHelp(GlobalSettings gs, Command command){
		gs.getOutStream().println();
		command.reportHelp( gs.getOutStream() );
		gs.getOutStream().println();
	}
}
