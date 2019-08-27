package ca.carleton.gcrc.couch.command;

import java.io.PrintStream;

import ca.carleton.gcrc.utils.VersionUtils;

public class CommandVersion implements Command {

	@Override
	public String getCommandString() {
		return "version";
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
		ps.println("Nunaliit2 Atlas Framework - Version Command");
		ps.println();
		ps.println("The version command reports the version of the Nunaliit");
		ps.println("command-line tool currently run.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit version <options>");
		ps.println();
		ps.println("options:");
		CommandHelp.reportGlobalOptions(ps,getExpectedOptions());
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 1 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(1));
		}

		
		PrintStream ps = gs.getOutStream();

		{
			String version = VersionUtils.getVersion();
			if( null == version ){
				version = "<unknown>";
			}
			ps.println("Version: "+version);
		}

		{
			String dateStr = VersionUtils.getDateString();
			if( null == dateStr ){
				dateStr = "<unknown>";
			}
			ps.println("Date: "+dateStr);
		}

		{
			String buildStr = VersionUtils.getBuildString();
			if( null == buildStr ){
				buildStr = "<unknown>";
			}
			ps.println("Build: "+buildStr);
		}
	}
}
