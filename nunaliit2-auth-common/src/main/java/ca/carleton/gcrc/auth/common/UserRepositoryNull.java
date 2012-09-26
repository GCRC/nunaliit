package ca.carleton.gcrc.auth.common;

import ca.carleton.gcrc.auth.common.impl.UserImpl;
import ca.carleton.gcrc.auth.common.impl.UserRepositoryAbstract;

public class UserRepositoryNull extends UserRepositoryAbstract implements UserRepository {

	@Override
	public void destroy() {
	}

	@Override
	public User getDefaultUser() throws Exception {
		return new UserImpl();
	}

	@Override
	public User authenticate(String userame, String password) throws Exception {
		throw new Exception("Unable to authenticate in a null repository");
	}

	@Override
	public User userFromId(int id) throws Exception {
		throw new Exception("No user in a null repository");
	}
}
