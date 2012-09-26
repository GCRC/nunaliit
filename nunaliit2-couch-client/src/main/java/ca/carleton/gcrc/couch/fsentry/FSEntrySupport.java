package ca.carleton.gcrc.couch.fsentry;

import java.util.List;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FSEntrySupport {

	static private Pattern patternExtension = Pattern.compile(".*\\.([^.]*)$");
	
	static public String extensionFromName(String name){
		String extension = null;

		if( null != name ) {
			Matcher matcherExtension = patternExtension.matcher( name );
			if( matcherExtension.matches() ) {
				extension = matcherExtension.group(1);
			}
		}
		
		return extension;
	}
	
	/**
	 * Traverses a directory structure designated by root and looks
	 * for a descendant with the provided path. If found, the supporting
	 * instance of FSEntry for the path is returned. If not found, null
	 * is returned.
	 * @param root Root of directory structure where the descendant is searched
	 * @param path Path of the seeked descendant
	 * @return The FSEntry for the descendant, or null if not found
	 * @throws Exception If one of the parameters is invalid
	 */
	static public FSEntry findDescendant(FSEntry root, String path) throws Exception {
		if( null == root ) {
			throw new Exception("root parameter should not be null");
		}
		
		List<String> pathFrags = interpretPath(path);
		
		// Iterate through path fragments, navigating through
		// the offered children
		FSEntry seekedEntry = root;
		for(String pathFrag : pathFrags){
			FSEntry nextEntry = null;
			List<FSEntry> children = seekedEntry.getChildren();
			for(FSEntry child : children){
				if( pathFrag.equals(child.getName()) ){
					// Found this one
					nextEntry = child;
					break;
				}
			}
			
			// If we have not found the next child, then it does not exist
			if( null == nextEntry ){
				return null;
			}
			
			seekedEntry = nextEntry;
		}
		
		return seekedEntry;
	}
	
	/**
	 * Utility method used to convert a path into its effective segments.
	 * @param path Path to be interpreted
	 * @return List of path fragments
	 * @throws Exception On invalid parameters
	 */
	static public List<String> interpretPath(String path) throws Exception {
		if( null == path ) {
			throw new Exception("path parameter should not be null");
		}
		if( path.codePointAt(0) == '/' ) {
			throw new Exception("absolute path is not acceptable");
		}

		// Verify path
		List<String> pathFragments = new Vector<String>();
		{
			String[] pathFrags = path.split("/");
			for(String pathFrag : pathFrags){
				if( ".".equals(pathFrag) ){
					// ignore
				} else if( "..".equals(pathFrag) ){
					throw new Exception("Parent references (..) not allowed");
				} else if( "".equals(pathFrag) ){
					// ignore
				} else {
					pathFragments.add(pathFrag);
				}
			}
		}
		
		return pathFragments;
	}
}
