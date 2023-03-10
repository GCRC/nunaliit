package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Vector;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.log4j.PatternLayout;
import org.apache.log4j.PropertyConfigurator;
import org.apache.log4j.WriterAppender;
import org.slf4j.bridge.SLF4JBridgeHandler;

import ca.carleton.gcrc.couch.command.Options.LoggerOptions;
import ca.carleton.gcrc.couch.command.impl.PathComputer;

public class Main {
	
	//final static private org.slf4j.Logger logger = LoggerFactory.getLogger(Main.class.getClass());
	
	static private List<Command> allCommands = null;
	synchronized static public List<Command> getCommands(){
		if( null == allCommands ) {
			allCommands = new Vector<Command>();
			
			allCommands.add( new CommandHelp() );
			allCommands.add( new CommandCreate() );
			allCommands.add( new CommandConfig() );
			allCommands.add( new CommandUpdate() );
			allCommands.add( new CommandUpdateUser() );
			allCommands.add( new CommandRun() );
			allCommands.add( new CommandDump() );
			allCommands.add( new CommandRestore() );
			allCommands.add( new CommandUpgrade() );
			allCommands.add( new CommandVersion() );
			allCommands.add( new CommandAddSchema() );
			allCommands.add( new CommandUpdateSchema() );
			allCommands.add( new CommandInReachSchemaDefs() );
		}
		
		return allCommands;
	}

	static public void main(String[] args) {

		// Resolves an issue when we try to scale an image, we get
		// "java.awt.AWTError: Assistive Technology not found: org.GNOME.Accessibility.AtkWrapper"
		// On headless JDK's, the AWT class is looking for this feature that is not available.
		System.setProperty("javax.accessibility.assistive_technologies", "");

		GlobalSettings globalSettings = null;
		
		try {
			List<String> arguments = new ArrayList<String>(args.length);
			for(String arg : args){
				arguments.add(arg);
			}
			
			globalSettings = new GlobalSettings();
			
			Main app = new Main();
			app.execute(globalSettings, arguments);
			System.exit(0);
			
		} catch(Exception e) {

			//logger.error("Error: "+e.getMessage(),e);
			
			PrintStream err = System.err;
			if( null != globalSettings ) {
				err = globalSettings.getErrStream();
			} 
			
			if( null != globalSettings 
			 && globalSettings.isDebug() ){
				e.printStackTrace(err);
				
			} else {
				err.print("Error: "+e.getMessage());
				err.println();
				
				int limit = 10;
				Throwable cause = e.getCause();
				while(null != cause && limit > 0) {
					err.print("Caused by: "+cause.getMessage());
					err.println();
					cause = cause.getCause();
					--limit;
				}
			}
			
			// Error
			System.exit(1);
		}
	}
	
	public void execute(GlobalSettings globalSettings, List<String> args) throws Exception {

		Options options = new Options();
		options.parseOptions(args);
		List<String> arguments = options.getArguments();
		
		// Process global options
		processGlobalOptions(globalSettings, options);

		// Default log4j configuration
		{
			Logger rootLogger = Logger.getRootLogger();

			List<LoggerOptions> loggerOptions = options.getLoggerOptions();
			
			boolean isRootLoggerSet = false;
			for(LoggerOptions loggerOption : loggerOptions) {
				if( null != loggerOption.getLevel() ) {
					if( null == loggerOption.getLoggerName() ) {
						// Root logger
						rootLogger.setLevel(loggerOption.getLevel());
						isRootLoggerSet = true;
					} else {
						// Obtain logger for this name
						Logger logger = Logger.getLogger(loggerOption.getLoggerName());
						logger.setLevel(loggerOption.getLevel());
					}
				}
			}
			
			if( !isRootLoggerSet ) {
				rootLogger.setLevel(Level.INFO);
			}
			
			rootLogger.addAppender(new WriterAppender(new PatternLayout("%d{ISO8601}[%-5p]: %m%n"),globalSettings.getErrStream()));
		}

		// Capture java.util.Logger
		{
			 // Optionally remove existing handlers attached to j.u.l root logger
			 SLF4JBridgeHandler.removeHandlersForRootLogger();  // (since SLF4J 1.6.5)

			 // add SLF4JBridgeHandler to j.u.l's root logger, should be done once during
			 // the initialization phase of your application
			 SLF4JBridgeHandler.install();
		}
		
		// Compute needed file paths
		{
			File installDir = PathComputer.computeInstallDir();
			
			globalSettings.setInstallDir( installDir );
		}
		
		// Find out command
		if( arguments.size() < 1 ){
			throw new Exception("No command provided. Try 'help'.");
		}
		CommandScanario cmdScanario = CommandScanario.getInstance();
		String commandKeyword = arguments.get(0);
		for(Command command : getCommands()){
			if( command.matchesKeyword(commandKeyword) ) {
				// Found the command in question
				cmdScanario.setCommand(commandKeyword);
				// Check options for this command
				String[] expectedOptions = command.getExpectedOptions();
				options.validateExpectedOptions(expectedOptions);

				// Execute
				performCommand(
					command
					,globalSettings
					,options
				);
				return;
			}
		}
		
		// At this point the command was not found
		throw new Exception("Can not understand command: "+commandKeyword);
	}

	private void processGlobalOptions(
		GlobalSettings globalSettings
		,Options options
		) throws Exception {

		// Atlas directory
		String atlasDirStr = options.getAtlasDir();
		if( null != atlasDirStr ){
			File atlasDir = PathComputer.computeAtlasDir(atlasDirStr);
			globalSettings.setAtlasDir(atlasDir);
		}

		// Debug
		Boolean debug = options.getDebug();
		if( null != debug ){
			if( debug.booleanValue() ){
				globalSettings.setDebug(true);
			}
		}
	}

	private void performCommand(Command command, GlobalSettings gs, Options options) throws Exception {
		if( command.requiresAtlasDir() ){
			if( null == gs.getAtlasDir() ) {
				// Use current directory
				gs.setAtlasDir( PathComputer.computeAtlasDir(null) );
			}
			
			// Verify that this is valid a nunaliit directory

			// Check that atlas directory exists
			File atlasDir = gs.getAtlasDir();
			if( false == atlasDir.exists() ){
				throw new Exception("Atlas directory not found: "+atlasDir.getAbsolutePath());
			}
			if( false == atlasDir.isDirectory() ){
				throw new Exception("Atlas is not a directory: "+atlasDir.getAbsolutePath());
			}

			// Check nunaliit.properties file
			{
				File propFile = new File(atlasDir,"config/nunaliit.properties");
				if( false == propFile.exists() 
				 || false == propFile.isFile() ) {
					throw new Exception("Directory does not appear to contain an atlas: "+atlasDir.getAbsolutePath());
				}
			}
		}
		
		// Configure log4j
		{
			// Try to load config/log4j.properties
			File atlasDir = gs.getAtlasDir();
			File log4jConfFile = new File(atlasDir, "config/log4j.properties");
			if( log4jConfFile.exists() 
			 && log4jConfFile.isFile() ) {
				PropertyConfigurator.configure(log4jConfFile.getAbsolutePath());
			}
		}
		
		command.runCommand(gs ,options);
	}
}
