package ca.carleton.gcrc.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.HashSet;
import java.util.Set;

public class Files {
	static public void copy(File source, File target) throws Exception {
		if( false == source.exists() ) {
			throw new Exception("Error copying files. "+source.getAbsolutePath()+" does not exist");
		}
		
		if( source.isDirectory() ){
			// Create target directory
			if( false == target.exists() ) {
				try {
					boolean created = target.mkdir();
					if( !created ){
						throw new Exception("Unable to create directory");
					}
				} catch(Exception e) {
					throw new Exception("Error copying files. Can not create directory: "+target.getAbsolutePath(),e);
				}
			}

			// Iterate over children
			String[] childrenNames = source.list();
			for(String childName : childrenNames){
				File childSource = new File(source,childName);
				File childTarget = new File(target,childName);
				
				copy(childSource,childTarget);
			}
			
		} else if( source.isFile() ) {
			if( target.exists() ){
				throw new Exception("Error copying files. File already exists: "+target.getAbsolutePath());
			}
			
			FileInputStream fis = null;
			FileOutputStream fos = null;
			try {
				fis = new FileInputStream(source);
				fos = new FileOutputStream(target);
				byte[] buffer = new byte[256];
				int count = fis.read(buffer);
				while( count >= 0 ){
					fos.write(buffer, 0, count);
					count = fis.read(buffer);
				}
				fos.flush();
				
			} catch(Exception e) {
				throw new Exception("Error copying file "+source.getAbsolutePath()+" to "+target.getAbsolutePath());

			} finally {
				if( null != fis ) {
					try {
						fis.close();
					} catch(Exception e) {
						// ignore
					}
				}
				if( null != fos ) {
					try {
						fos.close();
					} catch(Exception e) {
						// ignore
					}
				}
			}
			
		} else {
			throw new Exception("Error copying files. Can not determine type for: "+source.getAbsolutePath());
		}
	}
	
	/**
	 * Given a directory, returns a set of strings which are the paths to all elements
	 * within the directory. This process recurses through all sub-directories.
	 * @param dir The directory to be traversed
	 * @param includeDirectories If set, the name of the paths to directories are included
	 * in the result.
	 * @return A set of paths to all elements in the given directory
	 */
	static public Set<String> getDescendantPathNames(File dir, boolean includeDirectories) {
		Set<String> paths = new HashSet<String>();
		if( dir.exists() && dir.isDirectory() ) {
			String[] names = dir.list();
			for(String name : names){
				File child = new File(dir,name);
				getPathNames(child, paths, null, includeDirectories);
			}
		}
		return paths;
	}

	static private void getPathNames(File dir, Set<String> paths, String prefix, boolean includeDirectories) {
		if( dir.exists() ) {
			if( dir.isFile() ){
				String path = dir.getName();
				if( null != prefix ) {
					path = prefix + File.pathSeparator + dir.getName();
				}
				paths.add(path);
				
			} else if( dir.isDirectory() ) {
				String dirPath = dir.getName();
				if( null != prefix ) {
					dirPath = prefix + File.pathSeparator + dir.getName();
				}
				
				if( includeDirectories ){
					paths.add(dirPath);
				}
				
				// Children
				String[] names = dir.list();
				for(String name : names){
					File child = new File(dir,name);
					getPathNames(child, paths, dirPath, includeDirectories);
				}
			}
		}
	}

	static public void createDirectory(File dir) throws Exception {
		boolean created = false;
		try {
			created = dir.mkdirs();
			
		} catch(Exception e) {
			throw new Exception("Unable to create directory: "+dir.getAbsolutePath(), e);
		}
		
		if( !created ){
			throw new Exception("Unable to create directory: "+dir.getAbsolutePath());
		}
	}

	/**
	 * Given a directory, removes all the content found in the directory.
	 * @param dir The directory to be emptied
	 * @throws Exception
	 */
	static public void emptyDirectory(File dir) throws Exception {
		String[] fileNames = dir.list();
		if( null != fileNames ) {
			for(String fileName : fileNames){
				File file = new File(dir,fileName);
				if( file.isDirectory() ) {
					emptyDirectory(file);
				}
				boolean deleted = false;
				try {
					deleted = file.delete();
				} catch(Exception e) {
					throw new Exception("Unable to delete: "+file.getAbsolutePath(),e);
				}
				if( !deleted ){
					throw new Exception("Unable to delete: "+file.getAbsolutePath());
				}
			}
		}
	}
}
