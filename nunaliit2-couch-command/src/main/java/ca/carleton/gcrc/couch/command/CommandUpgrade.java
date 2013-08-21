package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.StringWriter;
import java.util.Calendar;
import java.util.Stack;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.command.impl.FileSetManifest;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.command.impl.UpgradeOperations;
import ca.carleton.gcrc.couch.command.impl.UpgradeOperationsBasic;
import ca.carleton.gcrc.couch.command.impl.UpgradeOperationsNull;
import ca.carleton.gcrc.couch.command.impl.UpgradeOperationsReporting;
import ca.carleton.gcrc.couch.command.impl.UpgradeProcess;
import ca.carleton.gcrc.couch.command.impl.UpgradeReport;

public class CommandUpgrade implements Command {

	@Override
	public String getCommandString() {
		return "upgrade";
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
		ps.println("Nunaliit2 Atlas Framework - Upgrade Command");
		ps.println();
		ps.println("The upgrade command allows a user to modifies the files located in an atlas");
		ps.println("so that they correspond to a different version of Nunaliit. This command");
		ps.println("should be used when a newer version of Nunaliit is available and the");
		ps.println("atlas creator wishes to use the newer version.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] upgrade [<upgrade-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Upgrade Options");
		ps.println("  --test        Does not perform any changes. Simply print");
		ps.println("                what would happen. Does not run 'config' command.");
		ps.println("  --no-config   Supresses the automatic 'config' command after");
		ps.println("                completing upgrade process.");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {
		
		// Pick up options
		boolean noConfig = false;
		boolean justTest = false;
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--test".equals(optionName) ){
				argumentStack.pop();
				justTest = true;
				
			} else if( "--no-config".equals(optionName) ){
				argumentStack.pop();
				noConfig = true;
				
			} else {
				break;
			}
		}

		
		File atlasDir = gs.getAtlasDir();

		// Verify that content directory is available
		File contentDir = PathComputer.computeContentDir( gs.getInstallDir() );
		if( null == contentDir 
		 || false == contentDir.exists() 
		 || false == contentDir.isDirectory() ){
			throw new Exception("Unable to find content directory");
		}

		// Verify that the installation directory is available
		File installationFilesDir = PathComputer.computeTemplatesDir( gs.getInstallDir() );
		if( null == installationFilesDir 
		 || false == installationFilesDir.exists() 
		 || false == installationFilesDir.isDirectory() ){
			throw new Exception("Unable to find installation files directory");
		}
		
		// Compute upgrade directory
		File upgradeCollisionDir = null;
		{
			Calendar calendar = Calendar.getInstance();
			String name = String.format(
				"upgrade_%04d-%02d-%02d_%02d:%02d:%02d"
				,calendar.get(Calendar.YEAR)
				,(calendar.get(Calendar.MONTH)+1)
				,calendar.get(Calendar.DAY_OF_MONTH)
				,calendar.get(Calendar.HOUR_OF_DAY)
				,calendar.get(Calendar.MINUTE)
				,calendar.get(Calendar.SECOND)
				);
			upgradeCollisionDir = new File(atlasDir, "upgrade/"+name);
		}
		
		// Figure out upgrade operations
		UpgradeOperations operations = null;
		if( justTest ) {
			operations = new UpgradeOperationsNull();
		} else {
			operations = new UpgradeOperationsBasic(
				atlasDir
				,contentDir
				,upgradeCollisionDir
				);
		}
		
		// Figure out reporting level
		UpgradeOperationsReporting reporting = new UpgradeOperationsReporting(
				atlasDir
				,upgradeCollisionDir
				,operations
				,gs.getOutStream()
				);
		if( justTest ) {
			reporting.setReportOperations(true);
			reporting.setReportCollisions(false);
		}
		
		// Compute installed file manifest
		FileSetManifest installedFileSetManifest = new FileSetManifest();
		try {
			File configDir = new File(atlasDir,"config");
			File manifestFile = new File(configDir,"nunaliit_manifest.json");
			
			if( manifestFile.exists() ){
				StringWriter sw = new StringWriter();
				FileInputStream is = null;
				InputStreamReader isr = null;
				char[] buffer = new char[100];
				try {
					is = new FileInputStream(manifestFile);
					isr = new InputStreamReader(is, "UTF-8");
					
					int size = isr.read(buffer);
					while( size >= 0 ) {
						sw.write(buffer, 0, size);
						size = isr.read(buffer);
					}
					
					sw.flush();
					
					JSONTokener tokener = new JSONTokener(sw.toString());
					Object result = tokener.nextValue();
					
					if( result instanceof JSONObject ){
						JSONObject jsonManifest = (JSONObject)result;
						installedFileSetManifest = FileSetManifest.fromJSON(jsonManifest);
					} else {
						throw new Exception("Unexpected JSON found in manifext file: "+result.getClass().getName());
					}
					
				} catch (Exception e) {
					throw new Exception("Error while reading file: "+manifestFile.getName(), e);
					
				} finally {
					if( null != isr ) {
						try {
							isr.close();
						} catch (Exception e) {
							// Ignore
						}
					}
					if( null != is ) {
						try {
							is.close();
						} catch (Exception e) {
							// Ignore
						}
					}
				}
			}
		} catch(Exception e) {
			throw new Exception("Unable to load installed file manifest",e);
		}

		// Upgrade content
		try {
			UpgradeProcess upgradeProcess = new UpgradeProcess();
			upgradeProcess.setUpgradedFilesDir(contentDir);
			upgradeProcess.setInstallationFilesDir(installationFilesDir);
			upgradeProcess.setTargetDir(atlasDir);
			upgradeProcess.setInstalledManifest(installedFileSetManifest);
			UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
			
			UpgradeProcess.performUpgrade(
				upgradeReport
				,reporting
				);
		
		} catch(Exception e) {
			throw new Exception("Unable to upgrade content",e);
		}
		
		// Perform configuration, unless disabled
		if( false == noConfig && false == justTest ){
			CommandConfig config = new CommandConfig();
			Stack<String> configArgs = new Stack<String>();
			config.runCommand(gs, configArgs);
		}
	}
}
