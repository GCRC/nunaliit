package ca.carleton.gcrc.couch.user.error;

@SuppressWarnings("serial")
public class TokenExpiredException extends Exception {

	public TokenExpiredException(){
		
	}

	public TokenExpiredException(String message){
		super(message);
	}

	public TokenExpiredException(String message, Throwable cause){
		super(message, cause);
	}

	public TokenExpiredException(Throwable cause){
		super(cause);
	}
}
