package ca.carleton.gcrc.couch.fsentry;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FSEntryMerged implements FSEntry {
	
	private enum _Internal{
		INTERNAL
	};
	
	private List<FSEntry> entries;
	
	public FSEntryMerged(List<FSEntry> entries) throws Exception {
		if( entries.size() < 1 ){
			throw new Exception("At least one entry must be provided in the constructor of FSEntryMerged");
		}
		
		this.entries = entries;
	}

	public FSEntryMerged(FSEntry entry) throws Exception {
		if( null == entry ){
			throw new Exception("An entry must be provided in the constructor of FSEntryMerged");
		}
		
		this.entries = new ArrayList<FSEntry>(1);
		this.entries.add(entry);
	}
	
	private FSEntryMerged(_Internal internal, List<FSEntry> files) {
		this.entries = files;
	}
	
	@Override
	public String getName() {
		return entries.get(0).getName();
	}

	@Override
	public String getExtension() {
		return FSEntrySupport.extensionFromName(getName());
	}

//	@Override
//	public File getFile() {
//		for(FSEntry entry : entries){
//			File file = entry.getFile();
//			if( null != file ) {
//				return file;
//			}
//		}
//		
//		return null;
//	}

	@Override
	public InputStream getInputStream() throws Exception {
		for(FSEntry entry : entries){
			InputStream is = entry.getInputStream();
			if( null != is ) {
				return is;
			}
		}
		
		return null;
	}

	@Override
	public boolean exists() {
		for(FSEntry entry : entries){
			if( entry.exists() ) {
				return true;
			}
		}
		
		return false;
	}

	@Override
	public boolean isFile() {
		return entries.get(0).isFile();
	}

	@Override
	public boolean isDirectory() {
		return entries.get(0).isDirectory();
	}

	@Override
	public long getSize() {
		return entries.get(0).getSize();
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
		
		Map<String,List<FSEntry>> childrenFromName = new HashMap<String,List<FSEntry>>();
		
		// Accumulate the lists of files
		for(FSEntry entry : entries){
			if( entry.isDirectory() ){
				List<FSEntry> childEntries = entry.getChildren(filter);
				if( null != childEntries ){
					for(FSEntry childEntry : childEntries){
						String childName = childEntry.getName();
						List<FSEntry> children = childrenFromName.get(childName);
						if( null == children ){
							children = new ArrayList<FSEntry>(entries.size());
							childrenFromName.put(childName,children);
						}
						
						children.add(childEntry);
					}
				}
			}
		}
		
		// Create children entries from names
		List<FSEntry> result = new ArrayList<FSEntry>(childrenFromName.keySet().size());
		for(List<FSEntry> children : childrenFromName.values()){
			FSEntryMerged entry = new FSEntryMerged(_Internal.INTERNAL, children);
			result.add(entry);
		}
		
		return result;
	}

	@Override
	public FSEntry getChild(String name) {
		// Accumulate the lists of files
		for(FSEntry entry : entries){
			FSEntry child = entry.getChild(name);
			if( null != child ){
				return child;
			}
		}

		return null;
	}

	@Override
	public boolean canExecute() {
		return entries.get(0).canExecute();
	}
}
