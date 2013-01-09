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

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ca.carleton.gcrc.auth.common.AuthHttpServletRequest;
import ca.carleton.gcrc.auth.common.AuthenticationUtils;
import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.auth.common.UserRepositorySingleton;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * This filters verifies the authorization and access privileges of an
 * HTTP request or just the access privileges of an AuthHTTP request
 * (i.e., one that has already been vetted by something like the 
 * AttachAuthFilter).  If authentication is performed here and accepted,
 * a Principal is added to the request for further processing and a cookie
 * is added as an authentication header to the response to let the client
 * know the status of its authentication.
 */
public class AuthFilter implements Filter {

	private static final String defaultRealm = "olkit";

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private UserRepository userRepository;
	private String realm = defaultRealm;
	private boolean allowAnonymous = false;
	private boolean allowUser = false;
	private boolean allowAdmin = true;
	
	public void init(FilterConfig config) throws ServletException {
		try {
			userRepository = UserRepositorySingleton.getSingleton();
		} catch (Exception e) {
			logger.error("Error while connecting to database",e);
			throw new ServletException("Error while connecting to database",e);
		}
		
		{
			String value = config.getInitParameter("anonymous");
			if( null != value ) {
				int intValue = Integer.parseInt(value);
				allowAnonymous = (0 != intValue);
			}
		}
		
		{
			String value = config.getInitParameter("user");
			if( null != value ) {
				int intValue = Integer.parseInt(value);
				allowUser = (0 != intValue);
			}
		}
		
		{
			String value = config.getInitParameter("admin");
			if( null != value ) {
				int intValue = Integer.parseInt(value);
				allowAdmin = (0 != intValue);
			}
		}
		
		{
			String value = config.getInitParameter("realm");
			if( null != value ) {
				this.realm = value;
			}
		}
	}

	public void destroy() {
		if( null != userRepository ) {
			userRepository.destroy();
		}
	}

	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
		boolean likeResponseType = false;
		
		HttpServletResponse response = null;
		if (servletResponse instanceof HttpServletResponse) {
			likeResponseType = true;
			response = (HttpServletResponse)servletResponse;
		}
		
		if (servletRequest instanceof AuthHttpServletRequest && likeResponseType) {
			AuthHttpServletRequest request = (AuthHttpServletRequest) servletRequest;
			try {
				checkAuthentication(request, response, chain);
			} catch (Exception e) {
				throw new ServletException("Error while filtering AuthHttpServletRequest",e);
			}
		} else if (servletRequest instanceof HttpServletRequest && likeResponseType) {
			HttpServletRequest request = (HttpServletRequest)servletRequest;
			try {
				checkAuthentication(request, response, chain);
			} catch (Exception e) {
				throw new ServletException("Error while filtering HttpServletRequest",e);
			}
		} else {
			// We handle only http requests
			logger.info("Skip filtering request because it is not HTTP");
			chain.doFilter(servletRequest, servletResponse);
		}
	}
	
	private void checkAndDispatch(
			User user,
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain chain) throws ServletException, IOException {
		
		boolean allowed = false;
		if( allowAnonymous && user.isAnonymous() ) {
			allowed = true;

		} else if( allowAdmin && user.isAdmin() ) {
			allowed = true;

		} else if( allowUser && !user.isAdmin() && !user.isAnonymous() ) {
			allowed = true;
		}
		
		if( allowed ) {
			chain.doFilter(request, response);
		} else {
			logger.info("User denied access ("+user+")");
			AuthenticationUtils.sendAuthRequiredError(response, realm);
		}
	}

	private void checkAuthentication(
			HttpServletRequest request, 
			HttpServletResponse response, 
			FilterChain chain) throws Exception {
		String[] userNameAndPassword = null;
		User user = null;
		if (request instanceof AuthHttpServletRequest) {
			
			user = AuthenticationUtils.getUserFromRequest(request);
			checkAndDispatch(user, request, response, chain);
			
		} else {
			
			String auth = request.getHeader("Authorization");
			logger.info("Authorization: "+auth);

			if( null == auth ) {
				AuthenticationUtils.sendAuthRequiredError(response, realm);
				return;
			}

			// From this point on, an auth has been provided.
			try {
				userNameAndPassword = AuthenticationUtils.getUserNameAndPassword(auth);
			} catch (Exception e) {
				throw new ServletException("Unable to acquire user",e);
			}
			try {
				user = userRepository.authenticate(userNameAndPassword[0],userNameAndPassword[1]);
			} catch (Exception e) {
				logger.info("Failed to authenticate user",e);
				AuthenticationUtils.sendAuthRequiredError(response, realm);
			}
			
			logger.info("user: "+user);
			String userJson = AuthenticationUtils.userToCookieString(true, user);
			Cookie cookie = new Cookie("nunaliit-auth",userJson);
			cookie.setPath("/");
			response.addCookie(cookie);
			
			checkAndDispatch(user, new AuthHttpServletRequest(request,user), response, chain);
			
		}
	}
}
