package ca.carleton.gcrc.couch.command.impl;

import java.io.File;

import ca.carleton.gcrc.javascript.CompressProcess;
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
		
		File nunaliitJsDir = new File(jsDir,"src/main/webapp/nunaliit2");
		
		generate(
			new File(jsDir, "compress/nunaliit2.cfg")
			,nunaliitJsDir
			,"nunaliit2.js"
			,"nunaliit2-debug.js"
			);
		
		generate(
			new File(jsDir, "compress/nunaliit2-couch.cfg")
			,nunaliitJsDir
			,"nunaliit2-couch.js"
			,"nunaliit2-couch-debug.js"
			);
		
		generate(
			new File(jsDir, "compress/nunaliit2-couch-mobile.cfg")
			,nunaliitJsDir
			,"nunaliit2-couch-mobile.js"
			,"nunaliit2-couch-mobile-debug.js"
			);
	}
	
	private void generate(File configFile, File sourceDirectory, String libraryName, String debugLibraryName) throws Exception {
		try {
			LibraryConfiguration config = new LibraryConfiguration();
			config.setSourceDirectory(sourceDirectory);
			config.parseConfiguration(configFile);

			// Create minimized version
			{
				CompressProcess compressProcess = new CompressProcess();
				compressProcess.generate(config, new File(sourceDirectory, libraryName));
			}
			
			// Create debug version
			{
				DebugProcess debugProcess = new DebugProcess();
				debugProcess.generate(config, new File(sourceDirectory, debugLibraryName));
			}

		} catch(Exception e) {
			throw new Exception("Error while generating javascript library: "+libraryName);
		}
	}
}
