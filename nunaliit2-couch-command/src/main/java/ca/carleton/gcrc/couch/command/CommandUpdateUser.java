package ca.carleton.gcrc.couch.command;

import java.io.PrintStream;
import java.util.Stack;

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
		ps.println("  nunaliit [<global-options>] update-user");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {

		PrintStream ps = gs.getErrStream();
		ps.println("This command is deprecated");
	}
}
