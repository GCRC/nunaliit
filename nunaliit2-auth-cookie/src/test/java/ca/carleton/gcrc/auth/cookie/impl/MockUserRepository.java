/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id$
*/
package ca.carleton.gcrc.auth.cookie.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.auth.common.impl.UserAndPassword;
import ca.carleton.gcrc.auth.common.impl.UserImpl;
import ca.carleton.gcrc.auth.common.impl.UserRepositoryAbstract;

public class MockUserRepository extends UserRepositoryAbstract implements UserRepository {

	private Map<Integer,UserAndPassword> usersById = new HashMap<Integer,UserAndPassword>();
	private UserAndPassword anonymous;
	private UserAndPassword admin;
	private UserAndPassword regular1;
	private UserAndPassword regular2;
	
	public MockUserRepository() {
		{
			UserAndPassword user = new UserAndPassword();
			user.setUser("admin");
			user.setId(1);
			user.setPassword("admin");
			user.setAdmin(true);
			user.setDisplayName("Administrator");
			Vector<Integer> groups = new Vector<Integer>();
			groups.add(1);
			user.setGroups(groups);
			
			usersById.put(user.getId(), user);
			admin = user;
		}
		
		{
			UserAndPassword user = new UserAndPassword();
			user.setUser("test");
			user.setId(2);
			user.setPassword("test");
			user.setDisplayName("Testing User");
			Vector<Integer> groups = new Vector<Integer>();
			groups.add(2);
			user.setGroups(groups);
			
			usersById.put(user.getId(), user);
			regular1 = user;
		}
		
		{
			UserAndPassword user = new UserAndPassword();
			user.setUser("anonymous");
			user.setId(3);
			user.setPassword("anonymous");
			user.setAnonymous(true);
			user.setDisplayName("Guest");
			Vector<Integer> groups = new Vector<Integer>();
			groups.add(0);
			user.setGroups(groups);
			
			usersById.put(user.getId(), user);
			anonymous = user;
		}
		
		{
			UserAndPassword user = new UserAndPassword();
			user.setUser("test2");
			user.setId(4);
			user.setPassword("test");
			user.setDisplayName("Testing User 2");
			Vector<Integer> groups = new Vector<Integer>();
			groups.add(2);
			user.setGroups(groups);
			
			usersById.put(user.getId(), user);
			regular2 = user;
		}
	}

	public UserAndPassword getAnonymous() {
		return anonymous;
	}

	public UserAndPassword getAdmin() {
		return admin;
	}

	public UserAndPassword getRegular1() {
		return regular1;
	}

	public UserAndPassword getRegular2() {
		return regular2;
	}

	
	public User authenticate(String username, String password) throws Exception {
		for(UserAndPassword user : usersById.values()) {

			if( username.equals(user.getUser()) ) {
				if( password.equals(user.getPassword()) ) {
					return user;
				}
				
				break;
			}
		}

		throw new Exception("Invalid username and/or password");
	}

	public void destroy() {
		usersById.clear();
	}

	public User getDefaultUser() throws Exception {
		return new UserImpl();
	}

	public User userFromId(int id) throws Exception {
		UserAndPassword user = usersById.get(id);
		if( null == user ) {
			throw new Exception("Invalid user id");
		}
		return user;
	}
}
