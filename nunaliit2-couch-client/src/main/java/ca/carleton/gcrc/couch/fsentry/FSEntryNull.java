package ca.carleton.gcrc.couch.fsentry;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class FSEntryNull implements FSEntry {

	private String name;
	
	public FSEntryNull(){
		name = "";
	}

	public FSEntryNull(String name){
		this.name = name;
	}
	
	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getExtension() {
		return FSEntrySupport.extensionFromName(getName());
	}

//	@Override
//	public File getFile() {
//		return null;
//	}

	@Override
	public InputStream getInputStream() throws Exception {
		return null;
	}

	@Override
	public boolean exists() {
		return false;
	}

	@Override
	public boolean isFile() {
		return false;
	}

	@Override
	public boolean isDirectory() {
		return false;
	}

	@Override
	public long getSize() {
		return 0;
	}

	@Override
	public List<FSEntry> getChildren() {
		return new ArrayList<FSEntry>(0);
	}

	@Override
	public List<FSEntry> getChildren(FSEntryNameFilter filter) {
		return new ArrayList<FSEntry>(0);
	}

	@Override
	public FSEntry getChild(String name) {
		return null;
	}

	@Override
	public boolean canExecute() {
		return false;
	}

}
