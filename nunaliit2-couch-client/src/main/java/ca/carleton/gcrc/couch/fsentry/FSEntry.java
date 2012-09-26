package ca.carleton.gcrc.couch.fsentry;

import java.io.InputStream;
import java.util.List;

/**
 * Instances implementing this interface are used to represent
 * File System elements. In some cases, file system element are directly
 * referenced. In other instances, in-memory buffers are used to
 * masquerade for files.
 *
 */
public interface FSEntry {

	/**
	 * Name of the entry. This includes the extension,
	 * if an extension is included in the name. However, the
	 * name does not include the path.
	 * @return Name of entry.
	 */
	String getName();
	
	/**
	 * Returns the portion of the name that appears after
	 * the last period.
	 * @return Extension from the name, or null if not extension is
	 * in the name
	 */
	String getExtension();
	
	/**
	 * Returns the File associated with the entry, if the entry
	 * refers to a File System element. Otherwise, returns null.
	 * @return File associated with this entry.
	 */
//	File getFile();
	
	/**
	 * Returns an input stream that should be used for reading the
	 * content of the entry. This is valid only for entries that represent
	 * a file. If an input stream is returned, the client should call close()
	 * on the stream when it is finished.
	 *  
	 * @return Input stream to read content of file. Returns null if there
	 * is not input stream associated with entry.
	 * @throws Exception
	 */
	InputStream getInputStream() throws Exception;
	
	/**
	 * Returns whether an entry exists. This makes sense only for FSEntryFile
	 * @return True is entry exists.
	 */
	boolean exists();
	
	/**
	 * Returns true if the entry refers to a file.
	 * @return True if entry refers to a file.
	 */
	boolean isFile();
	
	/**
	 * Returns true if the entry refers to a directory.
	 * @return True if entry refers to a directory.
	 */
	boolean isDirectory();
	
	/**
	 * Returns the size of the content, expressed in bytes. This makes
	 * sense only if the entry refers to a file.
	 * @return The size of the file, expressed in bytes.
	 */
	long getSize();
	
	/**
	 * Finds and returns a direct descendant entry to the receiving
	 * directory entry. If the receiving entry is not a directory,
	 * then this should return null.
	 * @param name Name of child
	 * @return The entry with the child name or null if not found.
	 */
	FSEntry getChild(String name);
	
	/**
	 * Returns entries that are children to the receiver. This makes
	 * sense only for entries that are directories. 
	 * @return List of children entries.
	 */
	List<FSEntry> getChildren();
	
	
	/**
	 * Returns entries that are children to the receiver and meet the criteria
	 * set by the provided filter. This makes sense only for entries that are 
	 * directories.
	 * @param filter Filter used to select desired children entries
	 * @return List of children entries.
	 */
	List<FSEntry> getChildren(FSEntryNameFilter filter);
	
	/**
	 * Returns true if the underlying entry has the execute bit set.
	 * @return True if the entry is executable.
	 */
	boolean canExecute();
}
