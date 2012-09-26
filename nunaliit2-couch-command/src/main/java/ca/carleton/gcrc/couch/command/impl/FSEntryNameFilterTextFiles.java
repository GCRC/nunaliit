package ca.carleton.gcrc.couch.command.impl;

import java.util.HashSet;
import java.util.Set;

import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryNameFilter;
import ca.carleton.gcrc.couch.fsentry.FSEntrySupport;

public class FSEntryNameFilterTextFiles implements FSEntryNameFilter {
	
	static public final FSEntryNameFilterTextFiles singleton = new FSEntryNameFilterTextFiles();
	
	private Set<String> extensions = new HashSet<String>();
	
	public FSEntryNameFilterTextFiles(){
		extensions.add("txt");
		extensions.add("html");
		extensions.add("htm");
		extensions.add("css");
		extensions.add("js");
		extensions.add("sh");
		extensions.add("bat");
		extensions.add("properties");
	}
	
	@Override
	public boolean accept(FSEntry parent, String name) {
		String ext = FSEntrySupport.extensionFromName(name);
		if( null == ext ) {
			return true;
		}
		return extensions.contains( ext.toLowerCase() );
	}
}
