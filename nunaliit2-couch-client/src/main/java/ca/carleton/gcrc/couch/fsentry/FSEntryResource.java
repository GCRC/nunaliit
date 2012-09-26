package ca.carleton.gcrc.couch.fsentry;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLDecoder;
import java.util.Enumeration;
import java.util.List;
import java.util.Vector;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

public class FSEntryResource implements FSEntry {

	/**
	 * Create a virtual tree hierarchy with a resource supporting the leaf.
	 * @param path Position of the file in the hierarchy, including its name
	 * @param classLoader Class loader used to find the needed resource
	 * @param resourceName Name of the actual resource to obtain using class loader
	 * @return The FSEntry root for this hierarchy
	 * @throws Exception Invalid parameter
	 */
	static public FSEntry getPositionedResource(String path, ClassLoader classLoader, String resourceName) throws Exception {
		List<String> pathFrags = FSEntrySupport.interpretPath(path);
		
		// Start at leaf and work our way back
		int index = pathFrags.size() - 1;
		FSEntry root = create(pathFrags.get(index), classLoader, resourceName);
		
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
	 * Creates an instance of FSEntryResource to represent an entry based on the resource
	 * specified by the classLoader and resource name.
	 * @param classLoader Class loader used to find the resource
	 * @param resourceName Actual name of resource
	 * @return An entry representing the specified resource.
	 * @throws Exception Invalid request
	 */
	static public FSEntryResource create(ClassLoader classLoader, String resourceName) throws Exception {
		return create(null, classLoader, resourceName);
	}
	
	/**
	 * Creates an instance of FSEntryResource to represent an entry based on the resource
	 * specified by the classLoader and resource name. This resource can be a file or a
	 * directory. Furthermore, this resource can be located on file system or inside
	 * a JAR file.
	 * @param name Name that the resource claims as its own. Useful to impersonate.
	 * @param classLoader Class loader used to find the resource
	 * @param resourceName Actual name of resource
	 * @return An entry representing the specified resource.
	 * @throws Exception Invalid request
	 */
	static public FSEntryResource create(String name, ClassLoader classLoader, String resourceName) throws Exception {
		URL url = classLoader.getResource(resourceName);

		if( "jar".equals( url.getProtocol() ) ) {
			String path = url.getPath();
			if( path.startsWith("file:") ) {
				int bangIndex = path.indexOf('!');
				if( bangIndex >= 0 ) {
					String jarFileName = path.substring("file:".length(), bangIndex);
					String resourceNameFile = path.substring(bangIndex+2);

					String resourceNameDir = resourceNameFile;
					if( false == resourceNameDir.endsWith("/") ) {
						resourceNameDir = resourceNameFile + "/";
					}

					JarFile jarFile = new JarFile(URLDecoder.decode(jarFileName, "UTF-8"));
					Enumeration<JarEntry> entries = jarFile.entries();
					while(entries.hasMoreElements()) {
						JarEntry jarEntry = entries.nextElement();
						String entryName = jarEntry.getName();

						if( entryName.equals(resourceNameFile) 
						 || entryName.equals(resourceNameDir) ) {
							
							// Compute name if required
							if( null == name ){
								name = nameFromJarEntry(jarEntry);
							}
							
							return new FSEntryResource(name, jarFile, jarEntry);
						}
					}
				}
			}
			
			throw new Exception("Unable to find resource: "+resourceName);
			
		} else if( "file".equals( url.getProtocol() ) ) {
			File file = new File( url.getFile() );
			if( null == name ){
				name = file.getName();
			}
			return new FSEntryResource(name, file);
			
		} else {
			throw new Exception("Unable to create resource entry for protocol: "+url.getProtocol());
		}
	}
	
	static private String nameFromJarEntry(JarEntry jarEntry){
		String[] parts = jarEntry.getName().split("/");
		int index = parts.length - 1;
		if( parts[index].length() == 0 ) {
			// Directory names end with a '/'
			--index;
		}
		return parts[index];
	}

	private String name;
	private JarFile jarFile = null;
	private JarEntry jarEntry = null;
	private File file = null;
	
	private FSEntryResource(String name, File file) {
		this.name = name;
		this.file = file;
		this.jarFile = null;
		this.jarEntry = null;
	}

	private FSEntryResource(String name, JarFile jarFile, JarEntry jarEntry) {
		this.name = name;
		this.file = null;
		this.jarFile = jarFile;
		this.jarEntry = jarEntry;
	}
	
	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getExtension() {
		return FSEntrySupport.extensionFromName(name);
	}

	@Override
	public InputStream getInputStream() throws Exception {
		if( null != file ) {
			if( file.isDirectory() ) {
				return null;
			}
			return new FileInputStream(file);
			
		} else if( null != jarFile && null != jarEntry ) {

			if( jarEntry.isDirectory() ) {
				return null;
			}
			return jarFile.getInputStream(jarEntry);
		}
		
		throw new Exception("Unable to create content input stream");
	}

	@Override
	public boolean exists() {
		return true;
	}

	@Override
	public boolean isFile() {
		if( null != file ) {
			return file.isFile();
		} else if( null != jarFile && null != jarEntry ) {
			return (false == jarEntry.isDirectory());
		}
		
		return false;
	}

	@Override
	public boolean isDirectory() {
		if( null != file ) {
			return file.isDirectory();
		} else if( null != jarFile && null != jarEntry ) {
			return jarEntry.isDirectory();
		}
		
		return false;
	}

	@Override
	public long getSize() {
		if( null != file ) {
			return file.length();
		} else if( null != jarFile && null != jarEntry ) {
			return jarEntry.getSize();
		}
		
		return 0;
	}

	@Override
	public FSEntry getChild(String name) {
		FSEntry result = null;
		
		if( null != file ) {
			if( file.exists() && file.isDirectory() ){
				File childFile = new File(file,name);
				if( childFile.exists() ) {
					result = new FSEntryResource(childFile.getName(), childFile);
				}
			}

		} else if( null != jarFile && null != jarEntry ) {
			if( jarEntry.isDirectory() ){
				String expectedNameFile = jarEntry.getName() + name;
				String expectedNameDir = jarEntry.getName() + name + "/";

				// Look for jar entry that matches expected name
				Enumeration<JarEntry> entries = jarFile.entries();
				while(entries.hasMoreElements()) {
					JarEntry entry = entries.nextElement();
					String entryName = entry.getName();

					if( entryName.equals(expectedNameFile) 
					 || entryName.equals(expectedNameDir) ) {
						// That's the one
						String childName = nameFromJarEntry(entry);
						result = new FSEntryResource(childName, jarFile, entry);
					}
				}
			}
		}
		
		return result;
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

		if( null != file ) {
			if( file.exists() && file.isDirectory() ){
				String[] childrenNames = file.list();
				if( null != childrenNames ){
					for(String childName : childrenNames){
						// Check if we should include this file
						if( filter.accept(this, childName) ) {
							File childFile = new File(file,childName);
							FSEntryResource childEntry = new FSEntryResource(childFile.getName(), childFile);
							result.add(childEntry);
						}
					}
				}
			}
			
		} else if( null != jarFile && null != jarEntry ) {
			if( jarEntry.isDirectory() ) {
	
				String jarEntryName = jarEntry.getName();
	
				// Look for jar entries that start with the name of this one
				Enumeration<JarEntry> entries = jarFile.entries();
				while(entries.hasMoreElements()) {
					JarEntry entry = entries.nextElement();
					String entryName = entry.getName();
	
					if( entryName.startsWith(jarEntryName) ) {
						// Get path passed self
						String childPath = entryName.substring(jarEntryName.length());
						
						// Do not consider self
						if( childPath.length() > 0 ) {
							FSEntryResource childEntry = null;
	
							// Check for sub-directories
							int bangIndex = childPath.indexOf("/");
							if( bangIndex >= 0 ) {
								// Accept only direct sub-directory
								if( bangIndex == childPath.length() - 1 ) {
									String childName = nameFromJarEntry(entry);
									childEntry = new FSEntryResource(childName, jarFile, entry);
								}
							} else {
								// File child
								String childName = nameFromJarEntry(entry);
								childEntry = new FSEntryResource(childName, jarFile, entry);
							}
							
							// Verify against filter
							if( null != childEntry ) {
								if( filter.accept(this, childEntry.getName()) ) {
									result.add(childEntry);
								}
							}
						}
					}
				}
			}
		}
		
		return result;
	}

	@Override
	public boolean canExecute() {
		if( null != file ) {
			return file.canExecute();
		} else if( null != jarFile && null != jarEntry ) {
			return false;
		}
		
		return false;
	}

}
