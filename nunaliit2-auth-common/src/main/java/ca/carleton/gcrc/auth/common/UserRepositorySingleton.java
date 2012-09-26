package ca.carleton.gcrc.auth.common;

public class UserRepositorySingleton {

	static private UserRepositoryWrapper singleton = 
		new UserRepositoryWrapper(
				new UserRepositoryNull()
			);
	
	static public UserRepository getSingleton() {
		return singleton;
	}
	
	static public void setSingleton(UserRepository wrapped) {
		singleton.setWrapped(wrapped);
	}
}
