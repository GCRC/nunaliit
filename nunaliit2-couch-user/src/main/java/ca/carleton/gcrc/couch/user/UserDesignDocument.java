package ca.carleton.gcrc.couch.user;

import java.util.Collection;
import java.util.List;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;

public interface UserDesignDocument {
	
	CouchDesignDocument getSupportingDesignDocument();
	
	Collection<UserDocument> getAllUsers() throws Exception;
	
	Collection<UserDocument> getUsersWithRole(String role) throws Exception;
	
	Collection<UserDocument> getUsersWithRoles(List<String> roles) throws Exception;
}
