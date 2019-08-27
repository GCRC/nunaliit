package ca.carleton.gcrc.couch.command.impl;

import java.io.File;

import ca.carleton.gcrc.css.LibraryConfiguration;
import ca.carleton.gcrc.css.MergeProcess;

public class GenerateCssLibrariesProcess {

	public GenerateCssLibrariesProcess(){
		
	}
	
	public void generate(File nunaliit2Dir) throws Exception {
		if( null == nunaliit2Dir ) {
			throw new Exception("Must specify a directory");
		}
		File jsDir = new File(nunaliit2Dir, "nunaliit2-js");
		if( false == jsDir.exists() || false == jsDir.isDirectory() ) {
			throw new Exception("Can not find nunaliit2-js directory");
		}
		
		File licenseFile = new File(jsDir, "compress/license.txt");
		File basicThemeFile = new File(jsDir, "compress/theme-basic.txt");
		File testThemeFile = new File(jsDir, "compress/theme-test.txt");
		File basicCssDir = new File(jsDir,"src/main/js/nunaliit2/css/basic");
		
		generate(
			new File(jsDir, "compress/nunaliit2-css.cfg")
			,licenseFile
			,basicThemeFile
			,basicCssDir
			,"nunaliit2.css"
			);

		generate(
			new File(jsDir, "compress/nunaliit2-css.cfg")
			,licenseFile
			,testThemeFile
			,basicCssDir
			,"nunaliit2-test.css"
			);

		generate(
			new File(jsDir, "compress/nunaliit2-css.cfg")
			,licenseFile
			,null
			,basicCssDir
			,"nunaliit2-notheme.css"
			);
		
		generate(
			new File(jsDir, "compress/nunaliit2-css-mobile.cfg")
			,licenseFile
			,basicThemeFile
			,basicCssDir
			,"nunaliit2-mobile.css"
			);
	}
	
	private void generate(
		File configFile
		,File licenseFile
		,File themeFile
		,File sourceDirectory
		,String libraryName
		) throws Exception {
		try {
			LibraryConfiguration config = new LibraryConfiguration();
			config.setSourceDirectory(sourceDirectory);
			config.setLicenseFile(licenseFile);
			config.parseConfiguration(configFile);
			if( null != themeFile ){
				config.addThemeFile(themeFile);
			}

			// Create merged version
			{
				MergeProcess mergeProcess = new MergeProcess();
				mergeProcess.generate(config, new File(sourceDirectory, libraryName));
			}

		} catch(Exception e) {
			throw new Exception("Error while generating CSS library: "+libraryName);
		}
	}
}
