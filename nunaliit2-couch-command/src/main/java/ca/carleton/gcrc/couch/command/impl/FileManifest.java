package ca.carleton.gcrc.couch.command.impl;


public class FileManifest {

	private String relativePath;
	private String digest;
	private boolean isDirectory = false;
	
	public String getRelativePath() {
		return relativePath;
	}

	public void setRelativePath(String relativePath) {
		this.relativePath = relativePath;
	}

	public String getDigest(){
		return digest;
	}

	public void setDigest(String digest) {
		this.digest = digest;
	}
	
	public boolean isDirectory() {
		return isDirectory;
	}

	public void setDirectory(boolean isDirectory) {
		this.isDirectory = isDirectory;
	}

	public boolean equals(Object o) {
		if ( this == o ) return true;

		if ( !(o instanceof FileManifest) ) return false;

		FileManifest other = (FileManifest)o;

	    if( relativePath == other.relativePath ) {
	    	// OK
	    } else if( null == relativePath ) {
	    	return false;
	    } else if( false == relativePath.equals(other.relativePath) ){
	    	return false;
	    }
	    
	    if( digest == other.digest ) {
	    	// OK
	    } else if( null == digest ) {
	    	return false;
	    } else if( false == digest.equals(other.digest) ){
	    	return false;
	    }
	    
	    if( isDirectory != other.isDirectory ){
	    	return false;
	    }
	    
	    return true;	
	}
}
