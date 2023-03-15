package ca.carleton.gcrc.couch.command;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Stack;
import java.util.Vector;

import org.apache.log4j.Level;

public class Options {
	
	static public class LoggerOptions {
		private String loggerName;
		private Level level;
		
		public LoggerOptions(String loggerName) {
			this.loggerName = loggerName;
		}

		public String getLoggerName() {
			return loggerName;
		}
		
		public Level getLevel() {
			return level;
		}

		public void setLevel(Level level) {
			this.level = level;
		}
	}
	
	static final public String OPTION_ATLAS_DIR = "--atlas-dir";
	static final public String OPTION_DEF = "--def";
	static final public String OPTION_GROUP = "--group";
	static final public String OPTION_ID = "--id";
	static final public String OPTION_DUMP_DIR = "--dump-dir";
	static final public String OPTION_DOC_ID = "--doc-id";
	static final public String OPTION_SCHEMA = "--schema";
	static final public String OPTION_LAYER = "--layer";
	static final public String OPTION_NAME = "--name";
	static final public String OPTION_ADD_SCHEMA = "--add-schema";

	static final public String OPTION_SET_LOGGER = "--set-logger";
	static final public String OPTION_DEBUG = "--debug";
	static final public String OPTION_TRACE = "--trace";
	static final public String OPTION_INFO = "--info";
	static final public String OPTION_ERROR = "--error";
	static final public String OPTION_NO_CONFIG = "--no-config";
	static final public String OPTION_SKELETON = "--skeleton";
	static final public String OPTION_OVERWRITE_DOCS = "--overwrite-docs";
	static final public String OPTION_ALL = "--all";
	static final public String OPTION_TEST = "--test";

	private List<String> arguments;
	private List<LoggerOptions> loggerOptions = new Vector<LoggerOptions>();
	private LoggerOptions currentLoggerOptions = null;
	private Boolean debug;
	private Boolean noConfig;
	private Boolean skeleton;
	private Boolean overwriteDocs;
	private Boolean all;
	private Boolean test;
	private Boolean addSchema;
	private String atlasDir;
	private String def;
	private String group;
	private String id;
	private String dumpDir;
	private Set<String> schemaNames = new HashSet<String>();
	private Set<String> layerNames = new HashSet<String>();
	private Set<String> docIds = new HashSet<String>();
	private String name;
	
	public Options() {
		arguments = new Vector<String>();

		loggerOptions = new Vector<LoggerOptions>();
		currentLoggerOptions = new LoggerOptions(null); // root logger
		loggerOptions.add(currentLoggerOptions);
	}
	
	public void parseOptions(List<String> args) throws Exception {
		Stack<String> argumentStack = new Stack<String>();
		for(int i=args.size()-1; i>=0; --i){
			argumentStack.push( args.get(i) );
		}

		while( false == argumentStack.empty() ){
			String arg = argumentStack.pop();
			
			if( arg.startsWith("--") ){
				// this is an option
				if( OPTION_DEBUG.equals(arg) ){
					if( null != currentLoggerOptions.level 
					 && Level.DEBUG != currentLoggerOptions.level ) {
						throw new Exception(OPTION_DEBUG+" conflicts with previous logger option");
					}

					debug = Boolean.TRUE;
					currentLoggerOptions.level = Level.DEBUG;

				} else if( OPTION_TRACE.equals(arg) ){
					if( null != currentLoggerOptions.level 
					 && Level.TRACE != currentLoggerOptions.level ) {
						throw new Exception(OPTION_TRACE+" conflicts with previous logger option");
					}

					debug = Boolean.TRUE; // trace is more specific than debug, so flag it
					currentLoggerOptions.level = Level.TRACE;

				} else if( OPTION_INFO.equals(arg) ){
					if( null != currentLoggerOptions.level 
					 && Level.INFO != currentLoggerOptions.level ) {
						throw new Exception(OPTION_INFO+" conflicts with previous logger option");
					}

					currentLoggerOptions.level = Level.INFO;

				} else if( OPTION_ERROR.equals(arg) ){
					if( null != currentLoggerOptions.level 
					 && Level.ERROR != currentLoggerOptions.level ) {
						throw new Exception(OPTION_ERROR+" conflicts with previous logger option");
					}

					currentLoggerOptions.level = Level.ERROR;

				} else if( OPTION_SET_LOGGER.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_SET_LOGGER+" option requires the name of a logger");
					}

					String loggerName = argumentStack.pop();

					currentLoggerOptions = new LoggerOptions(loggerName);
					loggerOptions.add(currentLoggerOptions);

				} else if( OPTION_NO_CONFIG.equals(arg) ){
					noConfig = Boolean.TRUE;

				} else if( OPTION_SKELETON.equals(arg) ){
					skeleton = Boolean.TRUE;

				} else if( OPTION_OVERWRITE_DOCS.equals(arg) ){
					overwriteDocs = Boolean.TRUE;

				} else if( OPTION_ALL.equals(arg) ){
					all = Boolean.TRUE;

				} else if( OPTION_TEST.equals(arg) ){
					test = Boolean.TRUE;

				} else if( OPTION_ATLAS_DIR.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_ATLAS_DIR+" option requires the directory where the atlas is located");
					}
					
					if( null != atlasDir ){
						throw new Exception("Option "+OPTION_ATLAS_DIR+" can be specified only once");
					}

					atlasDir = argumentStack.pop();

				} else if( OPTION_DEF.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_DEF+" option requires the location of a definition file");
					}
					
					if( null != def ){
						throw new Exception("Option "+OPTION_DEF+" can be specified only once");
					}

					def = argumentStack.pop();

				} else if( OPTION_GROUP.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_GROUP+" option requires the location of a group name");
					}
					
					if( null != group ){
						throw new Exception("Option "+OPTION_GROUP+" can be specified only once");
					}

					group = argumentStack.pop();

				} else if( OPTION_ID.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_ID+" option requires a container identifier");
					}
					
					if( null != id ){
						throw new Exception("Option "+OPTION_ID+" can be specified only once");
					}

					id = argumentStack.pop();

				} else if( OPTION_DUMP_DIR.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_DUMP_DIR+" option requires the location of the dump directory");
					}
					
					if( null != dumpDir ){
						throw new Exception("Option "+OPTION_DUMP_DIR+" can be specified only once");
					}

					dumpDir = argumentStack.pop();

				} else if( OPTION_SCHEMA.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_SCHEMA+" option requires the name of a schema");
					}
					
					String schemaName = argumentStack.pop();
					schemaNames.add(schemaName);

				} else if( OPTION_LAYER.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_LAYER+" option requires the name of a layer");
					}
					
					String layerName = argumentStack.pop();
					layerNames.add(layerName);

				} else if( OPTION_DOC_ID.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_DOC_ID+" option requires a document identifier");
					}
					
					String docId = argumentStack.pop();
					docIds.add(docId);

				} else if( OPTION_NAME.equals(arg) ){
					if( argumentStack.size() < 1 ){
						throw new Exception(OPTION_NAME+" option requires the name of a schema");
					}
					
					if( null != name ){
						throw new Exception("Option "+OPTION_NAME+" can be specified only once");
					}

					name = argumentStack.pop();

				} else if (OPTION_ADD_SCHEMA.equals(arg)) {
					addSchema = Boolean.TRUE;
				} else {
					throw new Exception("Unrecognized option: "+arg);
				}

			} else {
				arguments.add(arg);
			}
		}
	}
	
	public void validateExpectedOptions(String[] expectedOptions) throws Exception {
		Set<String> expected = new HashSet<String>();
		for(String expectedOption : expectedOptions){
			expected.add(expectedOption);
		}
		
		// Debug, trace, info, error and set-logger are always OK
//		if( null != debug && false == expected.contains(OPTION_DEBUG)){
//			throw new Exception("Unexpected option: "+OPTION_DEBUG);
//		}
//		if( null != trace && false == expected.contains(OPTION_TRACE)){
//			throw new Exception("Unexpected option: "+OPTION_TRACE);
//		}
//		if( null != info && false == expected.contains(OPTION_INFO)){
//			throw new Exception("Unexpected option: "+OPTION_INFO);
//		}
//		if( null != error && false == expected.contains(OPTION_ERROR)){
//			throw new Exception("Unexpected option: "+OPTION_ERROR);
//		}

		if( null != noConfig && false == expected.contains(OPTION_NO_CONFIG)){
			throw new Exception("Unexpected option: "+OPTION_NO_CONFIG);
		}
		if( null != skeleton && false == expected.contains(OPTION_SKELETON)){
			throw new Exception("Unexpected option: "+OPTION_SKELETON);
		}
		if( schemaNames.size() > 0 && false == expected.contains(OPTION_SCHEMA)){
			throw new Exception("Unexpected option: "+OPTION_SCHEMA);
		}
		if( layerNames.size() > 0 && false == expected.contains(OPTION_LAYER)){
			throw new Exception("Unexpected option: "+OPTION_LAYER);
		}
		if( null != overwriteDocs && false == expected.contains(OPTION_OVERWRITE_DOCS)){
			throw new Exception("Unexpected option: "+OPTION_OVERWRITE_DOCS);
		}
		if( null != all && false == expected.contains(OPTION_ALL)){
			throw new Exception("Unexpected option: "+OPTION_ALL);
		}
		if( null != test && false == expected.contains(OPTION_TEST)){
			throw new Exception("Unexpected option: "+OPTION_TEST);
		}
		if( null != atlasDir && false == expected.contains(OPTION_ATLAS_DIR)){
			throw new Exception("Unexpected option: "+OPTION_ATLAS_DIR);
		}
		if( null != def && false == expected.contains(OPTION_DEF)){
			throw new Exception("Unexpected option: "+OPTION_DEF);
		}
		if( null != group && false == expected.contains(OPTION_GROUP)){
			throw new Exception("Unexpected option: "+OPTION_GROUP);
		}
		if( null != id && false == expected.contains(OPTION_ID)){
			throw new Exception("Unexpected option: "+OPTION_ID);
		}
		if( null != dumpDir && false == expected.contains(OPTION_DUMP_DIR)){
			throw new Exception("Unexpected option: "+OPTION_DUMP_DIR);
		}
		if( docIds.size() > 0 && false == expected.contains(OPTION_DOC_ID)){
			throw new Exception("Unexpected option: "+OPTION_DOC_ID);
		}
		if( null != name && false == expected.contains(OPTION_NAME)){
			throw new Exception("Unexpected option: "+OPTION_NAME);
		}
	}

	public List<String> getArguments() {
		return arguments;
	}

	public List<LoggerOptions> getLoggerOptions(){
		return loggerOptions;
	}

	public Boolean getDebug() {
		return debug;
	}

	public Boolean getNoConfig() {
		return noConfig;
	}

	public Boolean getSkeleton() {
		return skeleton;
	}

	public Boolean getOverwriteDocs() {
		return overwriteDocs;
	}

	public Boolean getAll() {
		return all;
	}

	public Boolean getTest() {
		return test;
	}
	
	public Boolean getAddSchema() {
		return addSchema;
	}

	public String getAtlasDir() {
		return atlasDir;
	}

	public String getDef() {
		return def;
	}

	public String getGroup() {
		return group;
	}

	public String getId() {
		return id;
	}

	public String getDumpDir() {
		return dumpDir;
	}

	public Set<String> getDocIds() {
		return docIds;
	}

	public String getName() {
		return name;
	}
	
	public Set<String> getSchemaNames() {
		return schemaNames;
	}
	
	public Set<String> getLayerNames() {
		return layerNames;
	}
}
