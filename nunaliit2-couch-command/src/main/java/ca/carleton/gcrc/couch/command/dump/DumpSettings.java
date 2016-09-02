package ca.carleton.gcrc.couch.command.dump;

import java.io.BufferedReader;
import java.io.File;
import java.io.FilenameFilter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.Reader;
import java.util.List;
import java.util.Properties;
import java.util.Stack;
import java.util.Vector;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryNameFilter;

public class DumpSettings {

	public enum Type {
		DUMP
		,RESTORE
	};
	
	private Type opType = null;
	private PrintStream outStream = System.out;
	private PrintStream errStream = System.err;
	private BufferedReader inReader = null;
	private FilenameFilter filenameFilter = null;
	private FSEntryNameFilter fsEntryNameFilter = null;
	private boolean helpRequested = false;
	private boolean debug = false;
	private File dumpDir = null;
	private List<String> docIds = new Vector<String>();
	private String server = null;
	private String user = null;
	private String password = null;
	private String dbName = null;

	public DumpSettings(Type opType) throws Exception {
		this.opType  = opType;
		
		setInStream(System.in, "UTF-8");
		
		filenameFilter = new FilenameFilter(){
			@Override
			public boolean accept(File parent, String filename) {
				// Skip over special directories
				if( null != filename 
				 && filename.length() > 0
				 && filename.charAt(0) == '.' 
				 ) {
					return false;
				}
				return true;
			}
		};
		
		fsEntryNameFilter = new FSEntryNameFilter(){
			@Override
			public boolean accept(FSEntry parent, String name) {
				// Skip over special directories
				if( null != name 
				 && name.length() > 0
				 && name.charAt(0) == '.' 
				 ) {
					return false;
				}
				return true;
			}
		};
	}
	
	public void parseCommandLineArguments(Stack<String> argumentStack) throws Exception {
		// Pick up options
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--dump-dir".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("Directory expected for option '--dump-dir'");
				}
				String dumpDirStr = argumentStack.pop();
				File dumpDirFile = new File(dumpDirStr);
				setDumpDir(dumpDirFile);

			} else if( "--doc-id".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--doc-id option requires a document identifier");
				}
				
				String docId = argumentStack.pop();
				docIds.add(docId);

			} else if( "--schema".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--schema option requires the name of the document schema");
				}
				
			} else if( "--server".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--server option requires the URL to the CouchDB server");
				}

				setServer( argumentStack.pop() );

			} else if( "--user".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--user option requires the name of the user to connect to CouchDb");
				}

				setUser( argumentStack.pop() );

			} else if( "--password".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--password option requires the password of the user to connect to CouchDb");
				}

				setPassword( argumentStack.pop() );

			} else if( "--db".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--db option requires the name of the CouchDb database");
				}

				setDbName( argumentStack.pop() );
				
			} else if( "--help".equals(optionName) ){
					argumentStack.pop();
					setHelpRequested(true);
				
			} else if( "--debug".equals(optionName) ){
					argumentStack.pop();
					setDebug(true);
					
			} else {
				break;
			}
		}
	}

	public void acceptUserOptions() throws Exception {
		
		// server
		while( null == server ) {
			server = getUserInput("Enter the URL of the CouchDb server",null);
			if( null == server ){
				getErrStream().println("The URL to the CouchDb server must be specified");
			}
		}
		
		// dbName
		while( null == dbName ) {
			dbName = getUserInput("Enter the name of the database",null);
			if( null == dbName ){
				getErrStream().println("The name of the database must be specified");
			}
		}
		
		// user
		if( null == user ) {
			user = getUserInput("Enter the name of the user",null);
		}
		
		// password
		if( null != user && null == password ) {
			password = getUserInput("Enter the password for the user",null);
		}
		
		// dumpDir
		while( null == dumpDir ) {
			String prompt = null;
			if( opType == Type.DUMP ) {
				prompt = "Enter the directory where the disk documents should be sent";
			} else if( opType == Type.RESTORE ) {
				prompt = "Enter the directory where the disk documents are located";
			}
			String dumpDirStr = getUserInput(prompt,null);
			if( null == dumpDirStr ){
				getErrStream().println("The directory for the dump must be specified");
			} else {
				dumpDir = new File(dumpDirStr);
			}
		}
	}
	
	private String getUserInput(String prompt, String defaultValue) throws Exception {
		BufferedReader reader = getInReader();
		PrintStream ps = getOutStream();

		// Prompt user
		ps.print(prompt);
		if( null != defaultValue ){
			ps.print(" [");
			ps.print(defaultValue);
			ps.print("]");
		}
		ps.print(": ");
		
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

	public CouchClient createCouchClient() throws Exception {
		
		// Create couch client
		CouchClient couchClient = null;
		{
			Properties couchClientProps = new Properties();
			couchClientProps.put("couchdb.server", server);
			
			if( null != user && null != password ) {
				couchClientProps.put("couchdb.user", user);
				couchClientProps.put("couchdb.password", password);
			}
	
			CouchFactory couchFactory = new CouchFactory();
			couchClient = couchFactory.getClient(couchClientProps);
			
			// Verify that we can connect to the server
			try {
				couchClient.validateContext();
			} catch(Exception e) {
				throw new Exception("Unable to connect to the server. Probably a problem with server URL, user name or password.",e);
			}
		}
		return couchClient;
	}

	public CouchDb createCouchDb() throws Exception {
		
		CouchClient couchClient = createCouchClient();
		
		// Get database from Couch Client
		CouchDb couchDb = null;
		{
			if( false == couchClient.databaseExists(dbName) ) {
				throw new Exception("Can not find a database with the name: "+dbName);
			}
			couchDb = couchClient.getDatabase(dbName);
		}
		return couchDb;
	}
	
	public PrintStream getOutStream() {
		return outStream;
	}
	public void setOutStream(PrintStream outStream) {
		this.outStream = outStream;
	}
	
	public PrintStream getErrStream() {
		return errStream;
	}
	public void setErrStream(PrintStream errStream) {
		this.errStream = errStream;
	}
	
	public BufferedReader getInReader() {
		return inReader;
	}
	public void setInStream(InputStream inStream, String charEncoding) throws Exception {
		InputStreamReader isr = new InputStreamReader(inStream, charEncoding);
		BufferedReader bufReader = new BufferedReader(isr);
		
		this.inReader = bufReader;
	}
	public void setInReader(Reader reader) throws Exception {
		BufferedReader bufReader = new BufferedReader(reader);
		
		this.inReader = bufReader;
	}

	public FilenameFilter getFilenameFilter() {
		return filenameFilter;
	}
	public void setFilenameFilter(FilenameFilter filenameFilter) {
		this.filenameFilter = filenameFilter;
	}

	public FSEntryNameFilter getFsEntryNameFilter() {
		return fsEntryNameFilter;
	}
	public void setFsEntryNameFilter(FSEntryNameFilter fsEntryNameFilter) {
		this.fsEntryNameFilter = fsEntryNameFilter;
	}

	public boolean isHelpRequested() {
		return helpRequested;
	}
	public void setHelpRequested(boolean helpRequested) {
		this.helpRequested = helpRequested;
	}

	public boolean isDebug() {
		return debug;
	}
	public void setDebug(boolean debug) {
		this.debug = debug;
	}

	public File getDumpDir() {
		return dumpDir;
	}
	public void setDumpDir(File dumpDir) {
		this.dumpDir = dumpDir;
	}

	public List<String> getDocIds() {
		return docIds;
	}

	public String getServer() {
		return server;
	}
	public void setServer(String server) {
		this.server = server;
	}

	public String getUser() {
		return user;
	}
	public void setUser(String user) {
		this.user = user;
	}

	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}

	public String getDbName() {
		return dbName;
	}
	public void setDbName(String dbName) {
		this.dbName = dbName;
	}
}
