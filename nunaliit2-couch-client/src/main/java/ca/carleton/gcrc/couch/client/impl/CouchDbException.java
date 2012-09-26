package ca.carleton.gcrc.couch.client.impl;

@SuppressWarnings("serial")
public class CouchDbException extends Exception {

	private int returnCode;
	private String error;
	private String reason;
	
	public CouchDbException(int returnCode, String error, String reason){
		this.returnCode = returnCode;
		this.error = error;
		this.reason = reason;
	}
	
	public CouchDbException(int returnCode, String error, String reason, Throwable cause){
		super(cause);
		
		this.returnCode = returnCode;
		this.error = error;
		this.reason = reason;
	}

	@Override
	public String getMessage() {
		return "CouchDB Error ("+returnCode+") "+error+"/"+reason;
	}
}
