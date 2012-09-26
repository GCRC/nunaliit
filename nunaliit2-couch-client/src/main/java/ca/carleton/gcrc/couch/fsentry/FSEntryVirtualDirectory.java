package ca.carleton.gcrc.couch.fsentry;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Instances of this class are used to build a tree hierarchy
 * of FSEntry in memory.
 *
 */
public class FSEntryVirtualDirectory implements FSEntry {

	private String name;
	private Map<String,FSEntry> childrenByName = new HashMap<String,FSEntry>();
	
	public FSEntryVirtualDirectory(String name){
		this.name = name;
	}
	
	public void addChildEntry(FSEntry entry){
		childrenByName.put(entry.getName(), entry);
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
//		// Virtual, there is not actually a file
//		return null;
//	}

	@Override
	public InputStream getInputStream() throws Exception {
		// Virtual, no content
		return null;
	}

	@Override
	public boolean exists() {
		return true;
	}

	@Override
	public boolean isFile() {
		return false;
	}

	@Override
	public boolean isDirectory() {
		return true;
	}

	@Override
	public long getSize() {
		return 0;
	}

	@Override
	public List<FSEntry> getChildren() {
		return getChildren(FSEntryNameFilter.all);
	}

	@Override
	public List<FSEntry> getChildren(FSEntryNameFilter filter) {
		if( null == filter ){
			filter = FSEntryNameFilter.all;
		}

		List<FSEntry> result = new ArrayList<FSEntry>(childrenByName.size());
		for(FSEntry entry : childrenByName.values()){
			String childName = entry.getName();
			if( filter.accept(this, childName) ) {
				result.add(entry);
			}
		}
		
		return result;
	}

	@Override
	public FSEntry getChild(String name) {
		return childrenByName.get(name);
	}

	@Override
	public boolean canExecute() {
		return false;
	}
}
