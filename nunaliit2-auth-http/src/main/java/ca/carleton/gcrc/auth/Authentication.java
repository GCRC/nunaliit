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
package ca.carleton.gcrc.auth;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.auth.common.AuthenticationUtils;
import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;

public class Authentication {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private UserRepository userRepository = null;
	private boolean allowAnonymous = false;
	private boolean allowUser = false;
	private boolean allowAdmin = true;
	
	public Authentication(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public void setAllowAll(boolean allowAll) {
		this.allowAnonymous = allowAll;
		this.allowUser = allowAll;
		this.allowAdmin = allowAll;
	}
	
	public boolean isAllowAnonymous() {
		return allowAnonymous;
	}

	public void setAllowAnonymous(boolean allowAnonymous) {
		this.allowAnonymous = allowAnonymous;
	}

	public boolean isAllowUser() {
		return allowUser;
	}

	public void setAllowUser(boolean allowUser) {
		this.allowUser = allowUser;
	}

	public boolean isAllowAdmin() {
		return allowAdmin;
	}

	public void setAllowAdmin(boolean allowAdmin) {
		this.allowAdmin = allowAdmin;
	}

	public AuthenticationResult authenticateFromRequest(HttpServletRequest request) {
		// Default behaviour is not authenticated
		AuthenticationResult result = new AuthenticationResult();
		
		String auth = request.getHeader("Authorization");
		logger.info("Authorization: "+auth);
		if( null == auth ) {
			return result;
		}
		
		// From this point on, an auth has been provided.
		result.autenticationProvided = true;
		
		// Figure out username and password
		String[] userNameAndPassword = null;
		try {
			userNameAndPassword = AuthenticationUtils.getUserNameAndPassword(auth);
		} catch (Exception e) {
			logger.info("Unable to decode user name and password",e);
			return result;
		}

		// Fetch user from repository
		User user;
		try {
			user = userRepository.authenticate(userNameAndPassword[0],userNameAndPassword[1]);

			logger.info("user: "+user);
			
			result.user = user;
			
			if( allowAnonymous && user.isAnonymous() ) {
				result.allowed = true;
				
			} else if( allowAdmin && user.isAdmin() ) {
				result.allowed = true;
				
			} else if( allowUser && !user.isAdmin() && !user.isAnonymous() ) {
				result.allowed = true;
			}

		} catch (Exception e) {
			
			logger.info("Failing to authenticate user",e);
		}
		
		return result;
	}
}
