package ca.carleton.gcrc.couch.command;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.util.Properties;

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
		ps.println("  nunaliit version");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 1 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(1));
		}

		InputStream is = null;
		InputStreamReader isr = null;
		String version = "<unknown>";
		try {
			ClassLoader cl = CommandVersion.class.getClassLoader();
			is = cl.getResourceAsStream("version.properties");
			isr = new InputStreamReader(is,"UTF-8");
			Properties props = new Properties();
			props.load(isr);
			if( props.containsKey("version") ){
				version = props.getProperty("version");
			}
		} catch(Exception e) {
			throw new Exception("Error while extracting version resource",e);
		} finally {
			if( null != isr ){
				try {
					isr.close();
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != is ){
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		PrintStream ps = gs.getOutStream();
		ps.println("Version: "+version);
	}
}
