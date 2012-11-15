package ca.carleton.gcrc.couch.command;

import java.io.BufferedReader;
import java.io.File;
import java.io.PrintStream;
import java.util.Stack;

import ca.carleton.gcrc.couch.command.impl.FileSetManifest;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.command.impl.UpgradeOperationsBasic;
import ca.carleton.gcrc.couch.command.impl.UpgradeProcess;
import ca.carleton.gcrc.couch.command.impl.UpgradeReport;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class CommandCreate implements Command {

	@Override
	public String getCommandString() {
		return "create";
	}

	@Override
	public boolean matchesKeyword(String keyword) {
		if( getCommandString().equalsIgnoreCase(keyword) ) {
			return true;
		}
		return false;
	}

	@Override
	public boolean requiresAtlasDir() {
		return false;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Creation Command");
		ps.println();
		ps.println("The creation command allows a user to create a new atlas. During");
		ps.println("creation, a directory is created with a number of default files.");
		ps.println("This directory is referred to as the 'atlas directory' for");
		ps.println("subsequent commands.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] create [<create-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Create Options");
		ps.println("  --no-config   Skips the configuration phase");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {
		
		// Pick up options
		boolean noConfig = false;
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--no-config".equals(optionName) ){
				argumentStack.pop();
				noConfig = true;
			} else {
				break;
			}
		}

		// Figure out where atlas should be created
		File atlasDir = gs.getAtlasDir();
		if( null == atlasDir ){
			// Ask for directory
			BufferedReader reader = gs.getInReader();

			// Prompt user
			gs.getOutStream().print("Enter location where atlas should be created: ");
			
			// Read answer
			String line = null;
			try {
				line = reader.readLine();
			} catch(Exception e) {
				throw new Exception("Error while reading atlas directory from user",e);
			}
			
			atlasDir = PathComputer.computeAtlasDir(line);
			gs.setAtlasDir(atlasDir);
		}

		// Check if this is valid
		if( atlasDir.exists() ) {
			throw new Exception("Directory or file already exists: "+atlasDir.getAbsolutePath());
		}
		File parent = atlasDir.getParentFile();
		if( false == parent.exists() ){
			throw new Exception("Parent directory does not exist: "+parent.getAbsolutePath());
		}
		if( false == parent.isDirectory() ){
			throw new Exception("Parent path is not a directory: "+parent.getAbsolutePath());
		}
		
		// Verify that template directory is available
		File templateDir = PathComputer.computeTemplatesDir( gs.getInstallDir() );
		if( null == templateDir 
		 || false == templateDir.exists() 
		 || false == templateDir.isDirectory() ){
			throw new Exception("Unable to find template directory");
		}
		
		// Verify that content directory is available
		File contentDir = PathComputer.computeContentDir( gs.getInstallDir() );
		if( null == contentDir 
		 || false == contentDir.exists() 
		 || false == contentDir.isDirectory() ){
			throw new Exception("Unable to find content directory");
		}
		
		// Create directory
		try {
			boolean created = atlasDir.mkdir();
			if( !created ){
				throw new Exception("Directory not created");
			}
		} catch(Exception e) {
			throw new Exception("Unable to create directory: "+atlasDir,e);
		}
		gs.getOutStream().println("Created atlas directory at: "+atlasDir.getAbsolutePath());
		
		// Copy templates
		try {
			gs.getOutStream().println("Copying templates from: "+templateDir.getAbsolutePath());
			CopyMachine copyMachine = new CopyMachine();			
			copyMachine.setAcceptFileFilter(gs.getFsEntryNameFilter());
			
			File binDir = PathComputer.computeBinDir(gs.getInstallDir());
			if( null != binDir ) {
				copyMachine.addTextConversion("NUNALIIT_BIN_DIR", binDir.getAbsolutePath());
			}
			copyMachine.addTextConversion("ATLAS_DIR", atlasDir.getAbsolutePath());
			copyMachine.addTextConversion("ATLAS_NAME", "unknown");
			
			copyMachine.copyDir(new FSEntryFile(templateDir), atlasDir);
		
		} catch(Exception e) {
			throw new Exception("Unable to copy template to new atlas directory",e);
		}
		
		// Copy content by performing upgrade
		try {
			UpgradeProcess upgradeProcess = new UpgradeProcess();
			UpgradeReport upgradeReport = upgradeProcess.computeUpgrade(
				contentDir
				,atlasDir
				,new FileSetManifest() // new installation
				);
			
			UpgradeOperationsBasic operations = new UpgradeOperationsBasic(
				atlasDir
				,contentDir
				,new File(atlasDir, "upgrade/install")
				);
			upgradeProcess.performUpgrade(
				upgradeReport
				,operations
				);
		
		} catch(Exception e) {
			throw new Exception("Unable to copy content to new atlas directory",e);
		}
		
		// Create sub-directories
		{
			File mediaDir = new File(atlasDir,"media");
			try {
				boolean created = mediaDir.mkdir();
				if( !created ){
					throw new Exception("Directory not created");
				}
			} catch(Exception e) {
				throw new Exception("Unable to create media directory: "+mediaDir,e);
			}
		}
		
		// Perform configuration, unless disabled
		if( false == noConfig ){
			CommandConfig config = new CommandConfig();
			Stack<String> configArgs = new Stack<String>();
			config.runCommand(gs, configArgs);
		}
	}

}
