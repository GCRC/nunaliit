package ca.carleton.gcrc.auth.common;

import org.json.JSONObject;

public class UserRepositoryWrapper implements UserRepository {

	private UserRepository wrapped;
	
	public UserRepositoryWrapper() {
		
	}
	
	public UserRepositoryWrapper(UserRepository wrapped) {
		this.wrapped = wrapped;
	}
	
	synchronized public UserRepository getWrapped() {
		return wrapped;
	}

	synchronized public void setWrapped(UserRepository wrapped) {
		this.wrapped = wrapped;
	}

	@Override
	public void destroy() {
		getWrapped().destroy();
	}

	@Override
	public User getDefaultUser() throws Exception {
		return getWrapped().getDefaultUser();
	}

	@Override
	public User authenticate(String userame, String password) throws Exception {
		return getWrapped().authenticate(userame, password);
	}

	@Override
	public User userFromId(int id) throws Exception {
		return getWrapped().userFromId(id);
	}

	@Override
	public JSONObject userInfoFromId(int id) throws Exception {
		return getWrapped().userInfoFromId(id);
	}

}
