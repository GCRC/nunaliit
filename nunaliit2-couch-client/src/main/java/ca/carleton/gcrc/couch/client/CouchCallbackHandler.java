package ca.carleton.gcrc.couch.client;

public interface CouchCallbackHandler<CallbackType> {

	void handle(CallbackType callbackData);
	
	void onError(Exception e);
}
