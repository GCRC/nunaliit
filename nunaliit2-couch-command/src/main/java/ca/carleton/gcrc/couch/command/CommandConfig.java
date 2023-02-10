package ca.carleton.gcrc.couch.command;

import java.io.BufferedReader;
import java.io.File;
import java.io.PrintStream;
import java.net.URL;
import java.security.SecureRandom;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.commons.codec.binary.Base64;

import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.security.rng.RngFactory;

public class CommandConfig implements Command {

	private static final Logger log = LoggerFactory.getLogger(CommandConfig.class);
	final static private Pattern patternAtlasName = Pattern.compile("^[a-zA-Z][a-zA-Z0-9_]*$");
	final static private Pattern patternDbName = Pattern.compile("^[a-z][a-z0-9]*$");

	@Override
	public String getCommandString() {
		return "config";
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
				Options.OPTION_ATLAS_DIR
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Configuration Command");
		ps.println();
		ps.println("The configuration command allows a user to changes the parameters");
		ps.println("used to access and update an atlas.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit config <options>");
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

		// Check that atlas directory exists
		File atlasDir = gs.getAtlasDir();

		// Load up properties
		Properties props = getDefaultProperties();
		AtlasProperties.readProperties(atlasDir, props);

		// Create a server key, if one does not exist
		String serverKey = props.getProperty("server.key",null);
		if( null == serverKey ){
			SecureRandom rng = (new RngFactory()).createRng();
			byte[] key = new byte[16];
			rng.nextBytes(key);

			serverKey = Base64.encodeBase64String(key);
			props.setProperty("server.key", serverKey);
		}

		// Get user to enter properties
		userInputProperties(gs, props);

		// Write properties
		AtlasProperties.writeProperties(atlasDir, props);
		writeExtras(gs, atlasDir, props);
	}

	private void userInputProperties(GlobalSettings gs, Properties props) throws Exception {

		// Atlas Name
		{
			String atlasName = null;
			String defaultValue = props.getProperty("atlas.name");
			if( null == defaultValue || "".equals(defaultValue) ){
				defaultValue = gs.getAtlasDir().getName();
			}
			while( null == atlasName ) {
				atlasName = getUserStringInput(gs, "Enter the name of the atlas", defaultValue);
				if( null == atlasName ){
					gs.getErrStream().println("An atlas name must be provided");
				} else {
					Matcher matcher = patternAtlasName.matcher(atlasName);
					if( false == matcher.matches() ) {
						gs.getErrStream().println("An atlas name must start with a letter and be composed alpha-numerical characters");
						atlasName = null;
					}
				}
			}
			props.put("atlas.name", atlasName);
		}

		// CouchDB protocol
		{
			URL url = null;
			String urlString = null;
			while( null == url ) {
				urlString = getUserStringInput(gs, "Enter the URL to CouchDB", props, "couchdb.url");
				if( null == urlString ){
					gs.getErrStream().println("A URL must be provided for CouchDB");
				} else {
					try {
						url = new URL(urlString);
					} catch(Exception e) {
						gs.getErrStream().println("An invalid URL was entered");
					}
				}
			}
			props.put("couchdb.url", urlString);
			props.put("couchdb.url.protocol", url.getProtocol());
			props.put("couchdb.url.port", ""+url.getPort());
			props.put("couchdb.url.domain", url.getHost());
			props.put("couchdb.url.path", url.getPath());
		}

		// CouchDB main database name
		{
			String dbName = null;
			String defaultValue = props.getProperty("couchdb.dbName");
			if( null == defaultValue || "".equals(defaultValue) ){
				defaultValue = gs.getAtlasDir().getName();
			}
			while( null == dbName ) {
				dbName = getUserStringInput(gs, "Enter the name of the main database where atlas resides", defaultValue);
				if( null == dbName ){
					gs.getErrStream().println("A name for the database must be provided");
				} else {
					Matcher matcher = patternDbName.matcher(dbName);
					if( false == matcher.matches() ) {
						gs.getErrStream().println("A database name must start with a lowercase letter and be composed lowercase alpha-numerical characters");
						dbName = null;
					}
				}
			}
			props.put("couchdb.dbName", dbName);
		}

		// Submission database enabled?
		boolean submissionDbEnabled = false;
		{
			String defaultStringValue = props.getProperty("couchdb.submission.enabled");
			if( null == defaultStringValue || "".equals(defaultStringValue) ){
				defaultStringValue = "false";
			}
			boolean defaultValue = Boolean.parseBoolean(defaultStringValue);
			submissionDbEnabled = getUserBooleanInput(gs, "Do you wish to manually verify each document submission?", defaultValue);
			props.put("couchdb.submission.enabled", ""+submissionDbEnabled);
		}

		// CouchDB submission database name
		if( submissionDbEnabled ){
			String dbName = null;
			String defaultValue = props.getProperty("couchdb.submission.dbName");
			if( null == defaultValue || "".equals(defaultValue) ){
				String mainDbName = props.getProperty("couchdb.dbName");
				if( mainDbName != null && false == "".equals(mainDbName) ) {
					defaultValue = mainDbName + "submissions";
				} else {
					defaultValue = "submissions";
				}
			}
			while( null == dbName ) {
				dbName = getUserStringInput(gs, "Enter the name of the database where submissions will be uploaded", defaultValue);
				if( null == dbName ){
					gs.getErrStream().println("A name for the database must be provided");
				} else {
					Matcher matcher = patternDbName.matcher(dbName);
					if( false == matcher.matches() ) {
						gs.getErrStream().println("A database name must start with a lowercase letter and be composed lowercase alpha-numerical characters");
						dbName = null;
					}
				}
			}
			props.put("couchdb.submission.dbName", dbName);
		}

		// CouchDB admin name
		{
			String adminName = null;
			while( null == adminName ) {
				adminName = getUserStringInput(gs, "Enter the name of the admin user for CouchDB", props, "couchdb.admin.user");
				if( null == adminName ){
					gs.getErrStream().println("A name for the admin user must be provided");
				}
			}
			props.put("couchdb.admin.user", adminName);
		}

		// CouchDB admin password
		{
			String adminPassword = null;
			while( null == adminPassword ) {
				adminPassword = getUserStringInput(gs, "Enter the password for the admin user", props, "couchdb.admin.password");
				if( null == adminPassword ){
					gs.getErrStream().println("A password for the admin user must be provided");
				}
			}
			props.put("couchdb.admin.password", adminPassword);
		}

		// Servlet port
		{
			String portString = null;
			while( null == portString ) {
				portString = getUserStringInput(gs, "Enter the port where the atlas is served", props, "servlet.url.port");
				if( null == portString ){
					gs.getErrStream().println("A service port must be provided");
				} else {
					try {
						int port = Integer.parseInt(portString);
						if( 0 == port || port > 65535 ) {
							portString = null;
						}
					} catch(Exception e){
						portString = null;
					}

					if( null == portString ) {
						gs.getErrStream().println("Invalid port. It must be a positive integer up to 65535");
					}
				}
			}
			props.put("servlet.url.port", portString);
		}

		// Google Map API key
		{
			String key = getUserStringInput(
				gs,
				"Enter a Google Map API key (empty if not using)",
				props,
				"google.mapapi.key"
			);
			props.put("google.mapapi.key", key);
		}
	}

	private String getUserStringInput(GlobalSettings gs, String prompt, Properties props, String propName) throws Exception {
		String defaultValue = props.getProperty(propName);
		return getUserStringInput(gs, prompt, defaultValue);
	}

	private String getUserStringInput(GlobalSettings gs, String prompt, String defaultValue) throws Exception {
		BufferedReader reader = gs.getInReader();

		// Prompt user
		gs.getOutStream().print(prompt);
		if( null != defaultValue ){
			gs.getOutStream().print(" [");
			gs.getOutStream().print(defaultValue);
			gs.getOutStream().print("]");
		}
		gs.getOutStream().print(": ");

		// Read answer
		String line = null;
		try {
			line = reader.readLine();
		} catch(Exception e) {
			throw new Exception("Error while reading configuration information from user",e);
		}
		String userString = null;
		if( null == line ) {
			// End of stream reached
			throw new Exception("End of input stream reached");
		} else {
			line = line.trim();
			if( "".equals(line) ){
				userString = defaultValue;
				if( null == userString ){
					userString = "";
				};
			} else {
				userString = line;
			}
		}

		return userString;
	}

	private boolean getUserBooleanInput(GlobalSettings gs, String prompt, boolean defaultValue) throws Exception {
		BufferedReader reader = gs.getInReader();

		// Read answer
		boolean response = false;
		boolean validResponse = false;
		while( false == validResponse ) {
			// Prompt user
			gs.getOutStream().print(prompt);
			gs.getOutStream().print("(Y/N)");
			if( defaultValue ) {
				gs.getOutStream().print(" [Y]");
			} else {
				gs.getOutStream().print(" [N]");
			}
			gs.getOutStream().print(": ");

			String line = null;
			try {
				line = reader.readLine();
			} catch(Exception e) {
				throw new Exception("Error while reading configuration information from user",e);
			}
			if( null == line ) {
				// End of stream reached
				throw new Exception("End of input stream reached");
			} else {
				line = line.trim();
				if( "".equals(line) ){
					response = defaultValue;
					validResponse = true;
				} else {
					// Analyze response
					if( "y".equalsIgnoreCase(line) ) {
						response = true;
						validResponse = true;
					} else if( "yes".equalsIgnoreCase(line) ) {
						response = true;
						validResponse = true;
					} else if( "n".equalsIgnoreCase(line) ) {
						response = false;
						validResponse = true;
					} else if( "no".equalsIgnoreCase(line) ) {
						response = false;
						validResponse = true;
					}
				}
			}

			if( !validResponse ){
				gs.getErrStream().println("A valid response must be provided: Y, N or blank to accept previous value.");
			}
		}

		return response;
	}

	private Properties getDefaultProperties() {
		Properties props = new Properties();

		return props;
	}

	private void writeExtras(GlobalSettings gs, File atlasDir, Properties props) throws Exception {
		CopyMachine copyMachine = new CopyMachine();
		copyMachine.setAcceptFileFilter(gs.getFsEntryNameFilter());

		File binDir = PathComputer.computeBinDir(gs.getInstallDir());
		if( null != binDir ) {
			copyMachine.addTextConversion("NUNALIIT_BIN_DIR", binDir.getAbsolutePath());
		}
		copyMachine.addTextConversion("ATLAS_DIR", atlasDir.getAbsolutePath());
		copyMachine.addTextConversion("ATLAS_NAME", props.getProperty("atlas.name"));

		File templateDir = PathComputer.computeTemplatesDir( gs.getInstallDir() );
		File sourceExtra = new File(templateDir, "extra");
		File destExtra = new File(atlasDir, "extra");
		if( false == destExtra.exists() ){
			boolean created = destExtra.mkdir();
			if( false == created ){
				throw new Exception("Unable to create extra directory: "+ destExtra.getAbsolutePath());
			} else {
				log.info("Created extra directory: "+ destExtra.getAbsolutePath());
			}
		}

		copyMachine.copyDir(new FSEntryFile(sourceExtra), destExtra);
	}
}
