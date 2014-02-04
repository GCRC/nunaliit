package ca.carleton.gcrc.couch.user.error;

@SuppressWarnings("serial")
public class UserUpdatedException extends Exception {

	public UserUpdatedException(){
		
	}

	public UserUpdatedException(String message){
		super(message);
	}

	public UserUpdatedException(String message, Throwable cause){
		super(message, cause);
	}

	public UserUpdatedException(Throwable cause){
		super(cause);
	}
}
