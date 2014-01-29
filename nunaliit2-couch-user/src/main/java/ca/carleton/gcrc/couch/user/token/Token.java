package ca.carleton.gcrc.couch.user.token;

public interface Token {
	
	static final int APPLICATION_TYPE_ENCRYPTED = 1;
	static final int APPLICATION_TYPE_CREATION = 2;

	byte[] encode() throws Exception;
}
