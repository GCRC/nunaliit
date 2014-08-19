package ca.carleton.gcrc.couch.command.website;

import java.io.File;

import ca.carleton.gcrc.utils.Files;


public class WebsiteDumpProcess {
	private File atlasDir;
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
		
		File htdocsDir = new File(atlasDir,"htdocs");
		if( htdocsDir.exists() && htdocsDir.isDirectory() ){
			Files.copy(htdocsDir, dumpDir);
		}
	}
}
