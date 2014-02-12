package ca.carleton.gcrc.couch.command;

import java.io.BufferedReader;
import java.io.File;
import java.io.PrintStream;
import java.net.URL;
import java.security.SecureRandom;
import java.util.Properties;
import java.util.Stack;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.codec.binary.Base64;

import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.security.rng.RngFactory;

public class CommandConfig implements Command {
	
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
		ps.println("  nunaliit [<global-options>] config");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {
		
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
				atlasName = getUserInput(gs, "Enter the name of the atlas", defaultValue);
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
				urlString = getUserInput(gs, "Enter the URL to CouchDB", props, "couchdb.url");
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
				dbName = getUserInput(gs, "Enter the name of the main database where atlas resides", defaultValue);
				if( null == dbName ){
					gs.getErrStream().println("A name for the database must be provided");
				} else {
					Matcher matcher = patternDbName.matcher(dbName);
					if( false == matcher.matches() ) {
						gs.getErrStream().println("An database name must start with a lowercase letter and be composed lowercase alpha-numerical characters");
						dbName = null;
					}
				}
			}
			props.put("couchdb.dbName", dbName);
		}
		
		// CouchDB submission database name
		{
			String dbName = null;
			String defaultValue = props.getProperty("couchdb.submission.dbName");
			if( null == defaultValue || "".equals(defaultValue) ){
				defaultValue = gs.getAtlasDir().getName();
			}
			while( null == dbName ) {
				dbName = getUserInput(gs, "Enter the name of the database where submissions will be uploaded", defaultValue);
				if( null == dbName ){
					gs.getErrStream().println("A name for the database must be provided");
				} else {
					Matcher matcher = patternDbName.matcher(dbName);
					if( false == matcher.matches() ) {
						gs.getErrStream().println("An database name must start with a lowercase letter and be composed lowercase alpha-numerical characters");
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
				adminName = getUserInput(gs, "Enter the name of the admin user for CouchDB", props, "couchdb.admin.user");
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
				adminPassword = getUserInput(gs, "Enter the password for the admin user", props, "couchdb.admin.password");
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
				portString = getUserInput(gs, "Enter the port where the atlas is served", props, "servlet.url.port");
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
	}
	
	private String getUserInput(GlobalSettings gs, String prompt, Properties props, String propName) throws Exception {
		String defaultValue = props.getProperty(propName);
		return getUserInput(gs, prompt, defaultValue);
	}
	
	private String getUserInput(GlobalSettings gs, String prompt, String defaultValue) throws Exception {
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
		String atlasName = null;
		if( null == line ) {
			// End of stream reached
			throw new Exception("End of input stream reached");
		} else {
			line = line.trim();
			if( "".equals(line) ){
				atlasName = defaultValue;
			} else {
				atlasName = line;
			}
		}
		
		return atlasName;
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
		copyMachine.copyDir(new FSEntryFile(sourceExtra), destExtra);
		
		
	}
}
