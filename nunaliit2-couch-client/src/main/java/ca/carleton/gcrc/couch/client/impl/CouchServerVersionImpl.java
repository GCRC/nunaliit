package ca.carleton.gcrc.couch.client.impl;

import ca.carleton.gcrc.couch.client.CouchServerVersion;

public class CouchServerVersionImpl implements CouchServerVersion {

	private int major;
	private int minor;
	
	public CouchServerVersionImpl(int major, int minor) {
		this.major = major;
		this.minor = minor;
	}
	
	@Override
	public int getMajor() {
		return major;
	}
	
	public void setMajor(int major) {
		this.major = major;
	}
	
	@Override
	public int getMinor() {
		return minor;
	}
	
	public void setMinor(int minor) {
		this.minor = minor;
	}
	
	public String toString() {
		return ""+major+"."+minor;
	}
}
