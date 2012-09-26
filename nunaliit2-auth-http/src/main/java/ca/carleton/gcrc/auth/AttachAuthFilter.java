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
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.auth.common.AuthHttpServletRequest;
import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.auth.common.UserRepositorySingleton;

/**
 * This filters is intended to be deployed in the auth filter chain
 * prior to the real authorization filter.  It performs one simple function
 * which is to attach authentication information to requests for a configured
 * set of request paths, if those requests do not already carry authentication
 * headers.
 *
 * Two (actually three) cases:
 * 1) requests explicitly listed as 'attachAuth' requests: the filter checks to 
 *    see if the the request is carrying an authentication header and:
 *    a) If there is an authentication header, passes the request along the chain
 *       unmodified (IN PRACTICE but see notes below - in REALITY, this does not
 *       work).
 *    b) if there is no authentication header, then a configured and already
 *       authenticated user record is attached to the request and
 *       passed down the filter chain.  In this case, no authentication header is
 *       attached to the response so the exchange appears unauthenticated to the
 *       client.
 * 2) requests not listed as 'attachAuth' requests: these are passed down the
 *    chain unmodified.
 * 
 * Downstream filters need to be prepared to accept requests with or without the
 * authenticated user information attached.
 * 
 * Unfortunately, despite the design outlined which tries to avoid substituting
 * the configured user information for a carried authentication header, the common
 * request-challenge-request with authentication behaviour of browsers means that 
 * this approach fails to prevent the overrie of real login information in many
 * (most?) cases.
 * 
 * So this filter works really well to provide a means for you web app to bypass
 * authentication if it provides no benefit to your app.  But if you have an app
 * that sometimes needs login but you don't want to force it for some db access 
 * (e.g., queries) you will need to do a client-side auto-login.
 */
public class AttachAuthFilter implements Filter {
	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private UserRepository userRepository;
	String[] attachAuthList = null;

	// username to use for attachAuth requests (if no authentication header already included).
	String dbUserName = null;
	
	// password to use for attachAuth requests (if no authentication header already included).
	String dbUserPassword = null;
	User dbUser = null;
	
	public void init(FilterConfig config) throws ServletException {
		try {
			userRepository = UserRepositorySingleton.getSingleton();
		} catch (Exception e) {
			logger.error("Error while connecting to database",e);
			throw new ServletException("Error while connecting to database",e);
		}
		
		{
			String value = config.getInitParameter("attachAuth");
			if( null != value ) {
				attachAuthList = value.split(",");
			} else {
				throw new ServletException("attachAuth list not specified.");
			}
		}
		
		{
			String value = config.getInitParameter("dbUser");
			if( null != value ) {
				dbUserName = value;
			} else {
				throw new ServletException("dbUser not specified.");
			}
		}

		{
			String value = config.getInitParameter("dbPassword");
			if( null != value ) {
				dbUserPassword = value;
			} else {
				throw new ServletException("dbPassword not specified.");
			}
		}
		
		try {
			dbUser = userRepository.authenticate(dbUserName, dbUserPassword);
		} catch (Exception e) {
			throw new ServletException("Configured attachAuth name and password do not authenticate.", e);
		}
	}

	public void destroy() {
		if( null != userRepository ) {
			userRepository.destroy();
		}
	}

	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
		if (servletRequest instanceof HttpServletRequest &&
			servletResponse instanceof HttpServletResponse) {
			HttpServletRequest request = (HttpServletRequest)servletRequest;
			HttpServletResponse response = (HttpServletResponse)servletResponse;
			
			try {
				request = attachIfRequired(request);
				chain.doFilter(request, response);
			} catch (Exception e) {
				throw new ServletException("Error while filtering request",e);
			}
			
		} else {
			chain.doFilter(servletRequest, servletResponse); // We handle only http requests
		}
	}
	
	private boolean checkListContains(String[] list, String path) {
		for (String lPath : list) {
			if (lPath.equalsIgnoreCase(path)) {
				return(true);
			}
		}
		return(false);
	}

	private HttpServletRequest attachIfRequired(HttpServletRequest request) {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		boolean inAttachAuthList = checkListContains(attachAuthList, path);
		
		if (inAttachAuthList) {
			/*
			 * See if the request is already carrying an authorization heaader and, if so, 
			 * leave it and pass the request down the chain.  Don't want to override e.g.,
			 * the admin user with the default (probably anon) user if already really
			 * logged in....
			 */
			String auth = request.getHeader("Authorization");
			if (null == auth) {
				AuthHttpServletRequest chainedRequest = new AuthHttpServletRequest(request, dbUser);
				logger.info(this.getClass().getName()+" auth attached - path:"+path+" user:"+dbUser);
				return(chainedRequest);
			}
		}
		return(request);
	}
}
