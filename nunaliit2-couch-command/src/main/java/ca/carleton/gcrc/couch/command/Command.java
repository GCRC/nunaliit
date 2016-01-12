package ca.carleton.gcrc.couch.command;

import java.io.PrintStream;

public interface Command {
	
	boolean requiresAtlasDir();
	
	String getCommandString();
	
	boolean matchesKeyword(String keyword);
	
	boolean isDeprecated();

	String[] getExpectedOptions();
	
	void reportHelp(PrintStream ps);
	
	void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception;

}
