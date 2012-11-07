package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.io.FileFilter;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;

import org.json.JSONArray;
import org.json.JSONObject;

public class FileSetManifest {
	
	static private DigestComputerSha1 digestComputer = new DigestComputerSha1();
	static private FileFilter anyFilter = new FileFilter(){
		@Override
		public boolean accept(File arg0) {
			return true;
		}
	};
	
	static public FileSetManifest fromDirectory(File directory) throws Exception {
		return fromDirectory(directory,anyFilter);
	}
	
	static public FileSetManifest fromDirectory(File directory, FileFilter filter) throws Exception {
		if( null == directory ){
			throw new Exception("A directory must be provided: null");
		}
		if( false == directory.exists() ){
			throw new Exception("A directory must be provided: do not exist");
		}
		if( false == directory.isDirectory() ){
			throw new Exception("A directory must be provided: not a directory");
		}
		
		FileSetManifest fileSetManifest = new FileSetManifest();

		fromDirectory(fileSetManifest, directory,filter,new Stack<String>());
		
		return fileSetManifest;
	}
	
	static private void fromDirectory(
			FileSetManifest fileSetManifest
			,File directory
			,FileFilter filter
			,Stack<String> names
			) throws Exception {
		
		
		String[] childrenNames = directory.list();
		if( null != childrenNames ){
			for(String childName : childrenNames){
				names.push(childName);

				// Check if we should include this file
				File childFile = new File(directory,childName);
				if( filter.accept(childFile) ) {
					String name = null;
					for(String n : names){
						if( null == name ){
							name = n;
						} else {
							name = name + "/" + n;
						}
					}
					
					FileManifest fileManifest = new FileManifest();
					fileManifest.setRelativePath(name);
					if( childFile.isDirectory() ){
						fileManifest.setDirectory(true);
						fromDirectory(
								fileSetManifest
								,childFile
								,filter
								,names
							);
					} else {
						try {
							String digest = digestComputer.computeDocumentDigest(childFile);
							fileManifest.setDigest(digest);
						} catch(Exception e) {
							throw new Exception("Error while computing digest on file: "+childFile.getAbsolutePath(), e);
						}
					}
					
					fileSetManifest.addFileManifest(fileManifest);
				}

				names.pop();
			}
		}
	}

	static public FileSetManifest fromJSON(JSONObject jsonObj) throws Exception {
		if( null == jsonObj ){
			throw new Exception("JSON object must be provided when decoding a FileSetManifest");
		}

		FileSetManifest fileSetManifest = new FileSetManifest();

		try {
			JSONArray filesArray = jsonObj.optJSONArray("files");
			if( null != filesArray ) {
				for(int i=0,e=filesArray.length(); i<e; ++i){
					JSONObject fileObj = filesArray.getJSONObject(i);
					
					FileManifest fileManifest = new FileManifest();
					
					fileManifest.setRelativePath( fileObj.getString("path") );
					
					boolean isDir = fileObj.optBoolean("dir", false);
					fileManifest.setDirectory(isDir);
					
					String digest = fileObj.optString("digest",null);
					if( null != digest ) {
						fileManifest.setDigest(digest);
					}
					
					fileSetManifest.addFileManifest(fileManifest);
				}
			}
		} catch(Exception e) {
			throw new Exception("Error while decoding JSON file set manifest", e);
		}
		
		return fileSetManifest;
	}

	private Map<String,FileManifest> manifests = new HashMap<String,FileManifest>();
	
	public FileManifest getFileManifest(String relativePath){
		return manifests.get(relativePath);
	}
	
	public Collection<FileManifest> getAllFileManifest(){
		return manifests.values();
	}
	
	public void addFileManifest(FileManifest manifest){
		if( null != manifest ) {
			manifests.put(manifest.getRelativePath(), manifest);
		}
	}
	
	public JSONObject toJson() throws Exception {
		JSONObject jsonObject = new JSONObject();
		
		JSONArray filesArray = new JSONArray();
		for(FileManifest fileManifest : manifests.values()){
			JSONObject fileObj = new JSONObject();
			
			fileObj.put("path", fileManifest.getRelativePath());
			fileObj.put("dir", fileManifest.isDirectory());
			
			String digest = fileManifest.getDigest();
			if( null != digest ){
				fileObj.put("digest", digest);
			}
			
			filesArray.put(fileObj);
		}
		
		jsonObject.put("files", filesArray);
		
		return jsonObject;
	}
	
	public boolean equals(Object o){
		if ( this == o ) return true;

		if ( !(o instanceof FileSetManifest) ) return false;

		FileSetManifest other = (FileSetManifest)o;

		if( manifests.size() != other.manifests.size() ){
			return false;
		}
		
		for(FileManifest f1 : manifests.values()){
			FileManifest f2 = other.manifests.get(f1.getRelativePath());
			if( null == f2 ) {
				return false;
			}
			
			if( false == f1.equals(f2) ){
				return false;
			}
		}
	    
	    return true;	
	}
}
