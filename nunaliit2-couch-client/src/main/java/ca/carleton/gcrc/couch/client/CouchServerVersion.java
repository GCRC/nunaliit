package ca.carleton.gcrc.couch.client;

public interface CouchServerVersion {

	String getFullVersion();
	int getMajor();
	int getMinor();
}
