package ca.carleton.gcrc.couch.fsentry;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Vector;

/**
 * Instances of this class are FSEntry that are backed
 * by a disk file entry (File).
 *
 */
public class FSEntryFile implements FSEntry {

	/**
	 * Create a virtual tree hierarchy with a file supporting the leaf.
	 * @param path Position of the file in the hierarchy, including its name
	 * @param file The actual file, or directory , abcking the end leaf
	 * @return The FSEntry root for this hierarchy
	 * @throws Exception Invalid parameter
	 */
	static public FSEntry getPositionedFile(String path, File file) throws Exception {
		List<String> pathFrags = FSEntrySupport.interpretPath(path);
		
		// Start at leaf and work our way back
		int index = pathFrags.size() - 1;
		FSEntry root = new FSEntryFile(pathFrags.get(index), file);
		
		--index;
		while(index >= 0){
			FSEntryVirtualDirectory parent = new FSEntryVirtualDirectory(pathFrags.get(index));
			parent.addChildEntry(root);
			root = parent;
			--index;
		}
		
		return root;
	}
	
	private enum _Internal{
		INTERNAL
	};

	private String name;
	private File file;
	
	/**
	 * Constructor that accepts a file and a "virtual" name.
	 * This is useful when a file on disk should behave as if
	 * a different name was given to it.
	 * @param name Value that is returned by getName();
	 * @param file Actual disk file supporting this entry
	 * @throws Exception In a parameter is invalid
	 */
	public FSEntryFile(String name, File file) throws Exception {
		if( null == name ){
			throw new Exception("A name must be provided");
		}
		if( null == file ){
			throw new Exception("A file must be provided");
		}
		this.name = name;
		this.file = file;
	}

	public FSEntryFile(File file) throws Exception {
		if( null == file ){
			throw new Exception("A file must be provided");
		}
		this.file = file;
		this.name = file.getName();
	}

	private FSEntryFile(_Internal internal, File file) {
		this.file = file;
		this.name = file.getName();
	}
	
	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getExtension() {
		return FSEntrySupport.extensionFromName(getName());
	}

	public File getFile() {
		return file;
	}

	@Override
	public InputStream getInputStream() throws Exception {
		return new FileInputStream(file);
	}

	@Override
	public boolean exists() {
		return file.exists();
	}

	@Override
	public boolean isFile() {
		return file.isFile();
	}

	@Override
	public boolean isDirectory() {
		return file.isDirectory();
	}

	@Override
	public long getSize() {
		long size = 0;
		if( null != file ){
			size = file.length();
		}
		return size;
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
		
		List<FSEntry> result = new Vector<FSEntry>();
		if( file.exists() && file.isDirectory() ){
			String[] childrenNames = file.list();
			if( null != childrenNames ){
				for(String childName : childrenNames){
					// Check if we should include this file
					if( filter.accept(this, childName) ) {
						File childFile = new File(file,childName);
						FSEntryFile childEntry = new FSEntryFile(_Internal.INTERNAL, childFile);
						result.add(childEntry);
					}
				}
			}
		}
		
		return result;
	}

	@Override
	public FSEntry getChild(String name) {
		FSEntry result = null;
		
		if( file.exists() && file.isDirectory() ){
			File childFile = new File(file,name);
			if( childFile.exists() ) {
				result = new FSEntryFile(_Internal.INTERNAL, childFile);
			}
		}
		
		return result;
	}

	@Override
	public boolean canExecute() {
		return file.canExecute();
	}
}
