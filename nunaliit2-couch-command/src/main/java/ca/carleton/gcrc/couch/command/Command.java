package ca.carleton.gcrc.couch.command;

import java.io.PrintStream;
import java.util.Stack;

public interface Command {
	
	boolean requiresAtlasDir();
	
	String getCommandString();
	
	boolean matchesKeyword(String keyword);
	
	void reportHelp(PrintStream ps);
	
	void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception;

}
