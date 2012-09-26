package ca.carleton.gcrc.couch.fsentry;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;

/**
 * Instances of this class are used to masquerade
 * a file using a String.
 *
 */
public class FSEntryBuffer implements FSEntry {

	/**
	 * Create a virtual tree hierarchy with a buffer supporting the leaf.
	 * @param path Position of the buffer in the hierarchy, including its name
	 * @param content The actual buffer backing the end leaf
	 * @return The FSEntry root for this hierarchy
	 * @throws Exception Invalid parameter
	 */
	static public FSEntry getPositionedBuffer(String path, byte[] content) throws Exception {
		List<String> pathFrags = FSEntrySupport.interpretPath(path);
		
		// Start at leaf and work our way back
		int index = pathFrags.size() - 1;
		FSEntry root = new FSEntryBuffer(pathFrags.get(index), content);
		
		--index;
		while(index >= 0){
			FSEntryVirtualDirectory parent = new FSEntryVirtualDirectory(pathFrags.get(index));
			parent.addChildEntry(root);
			root = parent;
			--index;
		}
		
		return root;
	}

	/**
	 * Create a virtual tree hierarchy with a buffer supporting the leaf.
	 * @param path Position of the buffer in the hierarchy, including its name
	 * @param content The actual content, expressed as a String, backing the end leaf
	 * @return The FSEntry root for this hierarchy
	 * @throws Exception Invalid parameter
	 */
	static public FSEntry getPositionedBuffer(String path, String content) throws Exception {
		List<String> pathFrags = FSEntrySupport.interpretPath(path);
		
		// Start at leaf and work our way back
		int index = pathFrags.size() - 1;
		FSEntry root = new FSEntryBuffer(pathFrags.get(index), content);
		
		--index;
		while(index >= 0){
			FSEntryVirtualDirectory parent = new FSEntryVirtualDirectory(pathFrags.get(index));
			parent.addChildEntry(root);
			root = parent;
			--index;
		}
		
		return root;
	}

	private String name;
	private byte[] content;
	
	public FSEntryBuffer(String name, String content) throws Exception {
		this.name = name;
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		OutputStreamWriter osw = new OutputStreamWriter(baos, "UTF-8");
		osw.write(content);
		osw.flush();
		this.content = baos.toByteArray();
	}
	
	public FSEntryBuffer(String name, byte[] content) {
		this.name = name;
		this.content = content;
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
		ByteArrayInputStream bais = new ByteArrayInputStream(content);
		return bais;
	}

	@Override
	public boolean exists() {
		return true;
	}

	@Override
	public boolean isFile() {
		return true;
	}

	@Override
	public boolean isDirectory() {
		return false;
	}

	@Override
	public long getSize() {
		long size = 0;
		if( null != content ){
			size = content.length;
		}
		return size;
	}

	@Override
	public List<FSEntry> getChildren() {
		return new ArrayList<FSEntry>();
	}

	@Override
	public List<FSEntry> getChildren(FSEntryNameFilter filter) {
		return new ArrayList<FSEntry>();
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
