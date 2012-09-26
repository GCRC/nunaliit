package ca.carleton.gcrc.couch.command;

import java.io.BufferedReader;
import java.io.File;
import java.io.FilenameFilter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.Reader;

import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryNameFilter;

public class GlobalSettings {

	private PrintStream outStream = System.out;
	private PrintStream errStream = System.err;
	private BufferedReader inReader = null;
	private boolean debug = false;
	private File installDir;
	private File atlasDir;
	private FilenameFilter filenameFilter = null;
	private FSEntryNameFilter fsEntryNameFilter = null;

	public GlobalSettings() throws Exception {
		setInStream(System.in, "UTF-8");
		
		filenameFilter = new FilenameFilter(){
			@Override
			public boolean accept(File parent, String filename) {
				// Skip over special directories
				if( null != filename 
				 && filename.length() > 0
				 && filename.charAt(0) == '.' 
				 ) {
					return false;
				}
				return true;
			}
		};
		
		fsEntryNameFilter = new FSEntryNameFilter(){
			@Override
			public boolean accept(FSEntry parent, String name) {
				// Skip over special directories
				if( null != name 
				 && name.length() > 0
				 && name.charAt(0) == '.' 
				 ) {
					return false;
				}
				return true;
			}
		};
	}
	
	public PrintStream getOutStream() {
		return outStream;
	}
	public void setOutStream(PrintStream outStream) {
		this.outStream = outStream;
	}
	
	public PrintStream getErrStream() {
		return errStream;
	}
	public void setErrStream(PrintStream errStream) {
		this.errStream = errStream;
	}
	
	public BufferedReader getInReader() {
		return inReader;
	}
	public void setInStream(InputStream inStream, String charEncoding) throws Exception {
		InputStreamReader isr = new InputStreamReader(inStream, charEncoding);
		BufferedReader bufReader = new BufferedReader(isr);
		
		this.inReader = bufReader;
	}
	public void setInReader(Reader reader) throws Exception {
		BufferedReader bufReader = new BufferedReader(reader);
		
		this.inReader = bufReader;
	}

	public File getInstallDir() {
		return installDir;
	}
	public void setInstallDir(File installDir) {
		this.installDir = installDir;
	}

	public File getAtlasDir() {
		return atlasDir;
	}

	public void setAtlasDir(File atlasDir) {
		this.atlasDir = atlasDir;
	}

	public FilenameFilter getFilenameFilter() {
		return filenameFilter;
	}
	public void setFilenameFilter(FilenameFilter filenameFilter) {
		this.filenameFilter = filenameFilter;
	}

	public FSEntryNameFilter getFsEntryNameFilter() {
		return fsEntryNameFilter;
	}
	public void setFsEntryNameFilter(FSEntryNameFilter fsEntryNameFilter) {
		this.fsEntryNameFilter = fsEntryNameFilter;
	}

	public boolean isDebug() {
		return debug;
	}

	public void setDebug(boolean debug) {
		this.debug = debug;
	}
}
