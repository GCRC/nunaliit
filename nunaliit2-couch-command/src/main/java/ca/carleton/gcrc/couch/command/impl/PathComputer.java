package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.net.URL;

import ca.carleton.gcrc.couch.command.Main;

public class PathComputer {

	/**
	 * Computes the directory where the atlas resides given a command-line
	 * argument provided by the user. If the argument is not given, then
	 * this method should be called with a null argument.
	 * @param name Path given by user at the command-line to refer to the atlas
	 * @return Directory where atlas resides, based on the given argument
	 * */
	static public File computeAtlasDir(String name) {
		File atlasDir = null;
		
		if( null == name ) {
			// Current dir
			atlasDir = new File(".");
		} else {
			atlasDir = new File(name);
		}
		
		// Force absolute
		if( false == atlasDir.isAbsolute() ){
			atlasDir = atlasDir.getAbsoluteFile();
		}
		
		return atlasDir;
	}
	
	/**
	 * Computes the installation directory for the command line tool.
	 * This is done by looking for a known resource in a JAR file that
	 * ships with the command-line tool. When the resource is found, the
	 * location of the associated JAR file is derived. From there, the
	 * root directory of the installation is deduced.
	 * If the command-line tool is used in a development environment, then
	 * the known resource is found either as a file or within a JAR that lives
	 * within the project directory. In that case, return the root
	 * directory of the project.
	 * @return Directory of the command-line installed packaged or the root directory
	 * of the nunaliit2 project. If neither can be computed, return null.
	 * */
	static public File computeInstallDir() {
		File installDir = null;
		
		// Try to find the path of a known resource file
		File knownResourceFile = null;
		{
			URL url = Main.class.getClassLoader().getResource("commandResourceDummy.txt");
			if( null == url ){
				// Nothing we can do since the resource is not found
				
			} else if( "jar".equals( url.getProtocol() ) ) {
				// The tool is called from an "app assembly". Find the
				// parent of the "repo" directory
				String path = url.getPath();
				if( path.startsWith("file:") ) {
					int bangIndex = path.indexOf('!');
					if( bangIndex >= 0 ) {
						String jarFileName = path.substring("file:".length(), bangIndex);
						knownResourceFile = new File(jarFileName);
					}
				}
				
			} else if( "file".equals( url.getProtocol() ) ) {
				knownResourceFile = new File( url.getFile() );
			}
		}
		
		// Try to find the package installation directory. This should be the parent
		// of a sub-directory called "repo". This is the directory where all the
		// JAR files are stored in the command-line tool
		if( null == installDir && null != knownResourceFile ){
			File tempFile = knownResourceFile;
			boolean found = false;
			while( !found && null != tempFile ){
				if( "repo".equals( tempFile.getName() ) ){
					found = true;
					
					// Parent of "repo" is where the command-line tool is installed
					installDir = tempFile.getParentFile();
					
				} else {
					// Go to parent
					tempFile = tempFile.getParentFile();
				}
			}
		}
		
		// If the "repo" directory is not found, then look for the root
		// of the nunaliit2 project. In a development environment, this is what
		// we use to look for other directories.
		if( null == installDir && null != knownResourceFile ){
			installDir = computeNunaliitDir(knownResourceFile);
		}
		
		return installDir;
	}
	
	/**
	 * Finds the "templates" directory from the installation location
	 * and returns it. If the command-line tool is packaged and
	 * deployed, then the "templates" directory is found at the
	 * root of the installation. If the command-line tool is run
	 * from the development environment, then the "templates" directory
	 * is found in the SDK sub-project.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where templates are located or null if not found.
	 * */
	static public File computeTemplatesDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "templates");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-sdk/src/main/templates");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}
	

	/**
	 * Finds the "content" directory from the installation location
	 * and returns it. If the command-line tool is packaged and
	 * deployed, then the "content" directory is found at the
	 * root of the installation. If the command-line tool is run
	 * from the development environment, then the "content" directory
	 * is found in the SDK sub-project.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where content is located or null if not found.
	 */
	static public File computeContentDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File contentDir = new File(installDir, "content");
			if( contentDir.exists() && contentDir.isDirectory() ) {
				return contentDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			contentDir = new File(nunaliit2Dir, "nunaliit2-couch-sdk/src/main/content");
			if( contentDir.exists() && contentDir.isDirectory() ) {
				return contentDir;
			}
		}
		
		return null;
	}

	/**
	 * Finds the "bin" directory from the installation location
	 * and returns it. If the command-line tool is packaged and
	 * deployed, then the "bin" directory is found at the
	 * root of the installation. If the command-line tool is run
	 * from the development environment, then the "bin" directory
	 * is found in the SDK sub-project.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where binaries are located or null if not found.
	 * */
	static public File computeBinDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File binDir = new File(installDir, "bin");
			if( binDir.exists() && binDir.isDirectory() ) {
				return binDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			binDir = new File(nunaliit2Dir, "nunaliit2-couch-sdk/target/appassembler/bin");
			if( binDir.exists() && binDir.isDirectory() ) {
				return binDir;
			}
		}
		
		return null;
	}
	
	/**
	 * Finds the "siteDesign" directory from the installation location
	 * and returns it. If the command-line tool is packaged and
	 * deployed, then the "siteDesign" directory is found at the
	 * root of the installation. If the command-line tool is run
	 * from the development environment, then the "siteDesign" directory
	 * is found in the SDK sub-project.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where the site design document is located or null if not found.
	 * */
	static public File computeSiteDesignDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/siteDesign");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-sdk/src/main/internal/siteDesign");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}
	
	/**
	 * Finds the directory supporting the atlas design document from the 
	 * installation location and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "atlas" design document library is located 
	 * or null if not found.
	 * */
	static public File computeAtlasDesignDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/atlasDesign");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-application/src/main/atlas_couchapp");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}
	
	/**
	 * Finds the directory where the server design document is located 
	 * from the installation location and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "server" design document library is located 
	 * or null if not found.
	 * */
	static public File computeServerDesignDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/serverDesign");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-application/src/main/server_couchapp");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}
	
	/**
	 * Finds the directory where the mobile design document is located 
	 * from the installation location and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "mobile" design document library is located 
	 * or null if not found.
	 * */
	static public File computeMobileDesignDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/mobileDesign");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-mobile/src/main/webapp/WEB-INF/mobile_couchapp/app");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}
	
	/**
	 * Finds the directory supporting the submission design document from the 
	 * installation location and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "atlas" design document library is located 
	 * or null if not found.
	 * */
	static public File computeSubmissionDesignDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/submissionDesign");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-application/src/main/submission_couchapp");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}

	/**
	 * Finds the "nunaliit2" javascript library from the installation location
	 * and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "nunaliit2" javascript library is located 
	 * or null if not found.
	 * */
	static public File computeNunaliit2JavascriptDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/nunaliit2");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-js/src/main/js/nunaliit2");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}

	/**
	 * Finds the "external" javascript library from the installation location
	 * and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "external" javascript library is located 
	 * or null if not found.
	 * */
	static public File computeExternalJavascriptDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/js-external");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-js-external/src/main/js/js-external");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}

	/**
	 * Finds the directory with document initialization from the installation location
	 * and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "initialize" documents are located 
	 * or null if not found.
	 * */
	static public File computeInitializeDocsDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/initializeDocs");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-application/src/main/initializeDocs");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}

	/**
	 * Finds the directory with document updates from the installation location
	 * and returns it.
	 * @param installDir Directory where the command-line tool is run from.
	 * @return Directory where "update" documents are located 
	 * or null if not found.
	 * */
	static public File computeUpdateDocsDir(File installDir) {
		if( null != installDir ) {
			// Command-line package
			File templatesDir = new File(installDir, "internal/updateDocs");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
			
			// Development environment
			File nunaliit2Dir = computeNunaliitDir(installDir);
			templatesDir = new File(nunaliit2Dir, "nunaliit2-couch-application/src/main/updateDocs");
			if( templatesDir.exists() && templatesDir.isDirectory() ) {
				return templatesDir;
			}
		}
		
		return null;
	}
	
	/**
	 * Given an installation directory, find the root directory
	 * for the nunaliit2 project. This makes sense only in the
	 * context that the command-line tool is run from a development
	 * environment.
	 * @param installDir Computed install directory where command-line is run
	 * @return Root directory where nunaliit2 project is located, or null
	 * if not found.
	 */
	static public File computeNunaliitDir(File installDir) {
		while( null != installDir ){
			// The root of the nunalii2 project contains "nunaliit2-couch-command",
			// "nunaliit2-couch-sdk" and "nunaliit2-js"
			boolean commandExists = (new File(installDir, "nunaliit2-couch-command")).exists();
			boolean sdkExists = (new File(installDir, "nunaliit2-couch-sdk")).exists();
			boolean jsExists = (new File(installDir, "nunaliit2-js")).exists();
			
			if( commandExists && sdkExists && jsExists ){
				return installDir;
			} else {
				// Go to parent
				installDir = installDir.getParentFile();
			}
		}

		return null;
	}
	
}
