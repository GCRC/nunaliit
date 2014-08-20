package ca.carleton.gcrc.couch.command.website;

import java.io.File;

import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.utils.Files;


public class WebsiteDumpProcess {
	private File atlasDir;
	private File installDir;
	private File dumpDir;

	public File getAtlasDir() {
		return atlasDir;
	}

	public void setAtlasDir(File atlasDir) {
		this.atlasDir = atlasDir;
	}

	public File getDumpDir() {
		return dumpDir;
	}

	public void setDumpDir(File dumpDir) {
		this.dumpDir = dumpDir;
	}

	public File getInstallDir() {
		return installDir;
	}

	public void setInstallDir(File installDir) {
		this.installDir = installDir;
	}

	public void dump() throws Exception {
		if( null == dumpDir ){
			throw new Exception("dumpDir must be provided");
		}
		if( null == atlasDir ){
			throw new Exception("atlasDir must be provided");
		}
		
		// Create dump directory
		dumpDir.mkdirs();
		if( false == dumpDir.exists() || false == dumpDir.isDirectory() ){
			throw new Exception("Can not create web-site directory: "+dumpDir.getPath());
		}
		
		// Atlas files
		File htdocsDir = new File(atlasDir,"htdocs");
		if( htdocsDir.exists() && htdocsDir.isDirectory() ){
			Files.copy(htdocsDir, dumpDir);
		}

		// Nunaliit2 javascript library
		{
			File n2Dir = PathComputer.computeNunaliit2JavascriptDir(installDir);
			if( null == n2Dir ) {
				throw new Exception("Can not find nunaliit2 javascript library");
			} else {
				File n2Target = new File(dumpDir,"nunaliit2");
				n2Target.mkdirs();
				if( false == n2Target.exists() || false == n2Target.isDirectory() ){
					throw new Exception("Can not create nunaliit2 directory: "+n2Target.getPath());
				}
				
				Files.copy(n2Dir, n2Target);
			}
		}
		
		// External Javascript library
		{
			File externalDir = PathComputer.computeExternalJavascriptDir(installDir);
			if( null == externalDir ) {
				throw new Exception("Can not find external javascript library");
			} else {
				File extTarget = new File(dumpDir,"js-external");
				extTarget.mkdirs();
				if( false == extTarget.exists() || false == extTarget.isDirectory() ){
					throw new Exception("Can not create js-external directory: "+extTarget.getPath());
				}
				
				Files.copy(externalDir, extTarget);
			}
		}
		
		// Static content
		{
			File staticDir = PathComputer.computeStaticWebsiteDir(installDir);
			if( null == staticDir ) {
				throw new Exception("Can not find static website content");
			} else {
				Files.copy(staticDir, dumpDir);
			}
		}
	}
}
