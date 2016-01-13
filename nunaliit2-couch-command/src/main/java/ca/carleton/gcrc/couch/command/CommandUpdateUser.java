package ca.carleton.gcrc.couch.command;

import java.io.PrintStream;

public class CommandUpdateUser implements Command {

	@Override
	public String getCommandString() {
		return "update-user";
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
		return true;
	}

	@Override
	public String[] getExpectedOptions() {
		return new String[]{
				Options.OPTION_ATLAS_DIR
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return false;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Update User DB Command");
		ps.println();
		ps.println("This command is deprecated. It remains in the command-line");
		ps.println("tool to support legacy scripts. It does nothing.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit update-user <options>");
		ps.println();
		ps.println("options:");
		CommandHelp.reportGlobalOptions(ps,getExpectedOptions());
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		PrintStream ps = gs.getErrStream();
		ps.println("This command is deprecated");
	}
}
