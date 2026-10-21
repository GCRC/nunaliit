package ca.carleton.gcrc.couch.onUpload.inReach;

import java.util.List;

public interface InReachForm {

	String getTitle();
	String getDestination();
	String getPrefix();
	String getDelimiter();
	String getIdentifier();
	List<InReachFormField> getFields();
}
