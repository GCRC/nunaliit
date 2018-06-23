package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.javascript.CompressProcess;
import ca.carleton.gcrc.javascript.DebugInlineProcess;
import ca.carleton.gcrc.javascript.DebugProcess;
import ca.carleton.gcrc.javascript.LibraryConfiguration;

public class GenerateJavascriptLibrariesProcess {

	public GenerateJavascriptLibrariesProcess(){
		
	}
	
	public void generate(File nunaliit2Dir) throws Exception {
		if( null == nunaliit2Dir ) {
			throw new Exception("Must specify a directory");
		}
		File jsDir = new File(nunaliit2Dir, "nunaliit2-js");
		if( false == jsDir.exists() || false == jsDir.isDirectory() ) {
			throw new Exception("Can not find nunaliit2-js directory");
		}
		
		File nunaliitJsDir = new File(jsDir,"src/main/js/nunaliit2");
		File licenseFile = new File(jsDir,"compress/license.txt");
		
		generate(
			new File[] {
				new File(jsDir, "compress/nunaliit2.cfg")
				,new File(jsDir, "compress/nunaliit2-couch.cfg")
			}
			,licenseFile
			,nunaliitJsDir
			,"nunaliit2.js"
			,"nunaliit2-debug.js"
			,"nunaliit2-debug-il.js"
			);
		
		generate(
			new File[] {}
			,licenseFile
			,nunaliitJsDir
			,"nunaliit2-couch.js"
			,null
			,"nunaliit2-couch-debug.js"
			);
		
		generate(
			new File(jsDir, "compress/nunaliit2-couch-mobile.cfg")
			,licenseFile
			,nunaliitJsDir
			,"nunaliit2-couch-mobile.js"
			,null
			,"nunaliit2-couch-mobile-debug.js"
			);
	}
	
	private void generate(
		File configFile
		,File licenseFile
		,File sourceDirectory
		,String libraryName
		,String debugLibraryName
		,String debugInlineLibraryName
		) throws Exception {
		
		List<File> configFiles = new Vector<File>();
		if( null != configFile ) {
			configFiles.add(configFile);
		}
		
		generate(
				configFiles, 
				licenseFile, 
				sourceDirectory, 
				libraryName, 
				debugLibraryName, 
				debugInlineLibraryName
			);
	}
	
	private void generate(
		File[] configFileArr
		,File licenseFile
		,File sourceDirectory
		,String libraryName
		,String debugLibraryName
		,String debugInlineLibraryName
		) throws Exception {
		
		List<File> configFiles = new Vector<File>();
		if( null != configFileArr ) {
			for(File configFile : configFileArr) {
				configFiles.add(configFile);
			}
		}
		
		generate(
				configFiles, 
				licenseFile, 
				sourceDirectory, 
				libraryName, 
				debugLibraryName, 
				debugInlineLibraryName
			);
	}
	
	private void generate(
		List<File> configFiles
		,File licenseFile
		,File sourceDirectory
		,String libraryName
		,String debugLibraryName
		,String debugInlineLibraryName
		) throws Exception {
		
		try {
			LibraryConfiguration config = new LibraryConfiguration();
			config.setLicenseFile(licenseFile);
			config.setSourceDirectory(sourceDirectory);
			
			for(File configFile : configFiles) {
				config.parseConfiguration(configFile);
			}

			// Create compressed version
			if( null != libraryName ){
				CompressProcess compressProcess = new CompressProcess();
				compressProcess.generate(config, new File(sourceDirectory, libraryName));
			}
			
			// Create debug version
			if( null != debugLibraryName ){
				DebugProcess debugProcess = new DebugProcess();
				debugProcess.generate(config, new File(sourceDirectory, debugLibraryName));
			}
			
			// Create debug inline version
			if( null != debugInlineLibraryName ){
				DebugInlineProcess debugInlineProcess = new DebugInlineProcess();
				debugInlineProcess.generate(config, new File(sourceDirectory, debugInlineLibraryName));
			}

		} catch(Exception e) {
			throw new Exception("Error while generating javascript library: "+libraryName);
		}
	}
}
