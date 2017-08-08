package ca.carleton.gcrc.couch.onUpload.inReach;

import java.util.List;

public interface InReachFormField {

	String getName();
	
	String getType();
	
	boolean isRequired();
	
	List<String> getValues();
	
	Long getLength();
	
	String getDefault();
}
