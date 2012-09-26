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
import java.io.OutputStreamWriter;
import java.util.Date;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.auth.common.AuthenticationUtils;
import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.auth.common.UserRepositorySingleton;
import ca.carleton.gcrc.auth.impl.SetUserException;

public class AuthServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private static final String defaultRealm = "olkit";

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private UserRepository userRepository;
	private String realm = defaultRealm;
	
	public AuthServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
	
		userRepository = UserRepositorySingleton.getSingleton();
	}

	public void destroy() {
		if( null != userRepository ) {
			userRepository.destroy();
		}
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		
		logger.info(this.getClass().getName()+" "+path);

		try {
			if( "login".equalsIgnoreCase(path) ) {
				performLogin(request, response);
		
			} else if( "logout".equalsIgnoreCase(path) ) {
				performLogout(request, response);
				
			} else if( "test".equalsIgnoreCase(path) ) {
				performTest(request, response);
			
			} else {
				throw new Exception("Unknown request: "+path);
			}
			
		} catch(SetUserException e) {
			logger.info("Error(setUser) encountered while performing: "+path,e);
			try {
				setUserCookie(response, false, e.getUser());
			} catch (Exception e1) {
				// Ignored
			}
			sendErrorResponse(response, e);

		} catch(Exception e) {
			logger.info("Error encountered while performing: "+path,e);
			sendErrorResponse(response, e);
		}
	}
	
	private void performLogin(HttpServletRequest request, HttpServletResponse response) throws Exception {
		
		// Verify if this is a call to adjust cookies
		boolean adjustCookies = false;
		{
			// If parameter "adjustCookies" is set to anything other than 0,
			// then we are in the mode of adjusting cookies
			String[] adjustCookiesParams = request.getParameterValues("adjustCookies");
			if( null != adjustCookiesParams ) {
				for(int loop=0; loop<adjustCookiesParams.length; ++loop) {
					if( false == "0".equals( adjustCookiesParams[loop] ) ) {
						adjustCookies = true;
					}
				}
			}
		}
		
		// Get name if provided
		String name = null;
		{
			String[] nameParams = request.getParameterValues("name");
			if( null != nameParams ) {
				if( nameParams.length > 1 ) {
					throw new Exception("name parameter provided multiple times");
				}
				if( nameParams.length == 1 ) {
					name = nameParams[0];
				}
			}
		}
		
		// Get authorization
		String auth = request.getHeader("Authorization");
		
		logger.info("Login authorization: "+auth+" name:"+name+" adjustCookies: "+adjustCookies);
		
		if( null == auth ) {
			// No authentication provided. Assume default user.
			User user = userRepository.getDefaultUser();

			// If adjusting cookies, do not complain and return OK
			if( adjustCookies ) {
				acceptRequest(response, false, user);
				
			} else {
				// Inform client that authentication is required.
				rejectRequest(response);
			}
			return;
		}
		
		String[] userNameAndPassword = null;
		try {
			userNameAndPassword = AuthenticationUtils.getUserNameAndPassword(auth);
		} catch (Exception e) {
			throw new Exception("Unable to acquire user",e);
		}
		
		// An auth has been provided. Check that the auth corresponds to
		// the 'name' provided by the script. This is to avoid a situation
		// where the browser has changed its tokens, already learned from
		// the fact that this path is protected and supplies already known
		// credentials, ignoring the username and password provided in the
		// XmlHttpRequest
		
		if( false == adjustCookies ) {
			if( null == name ) {
				// We're not adjusting cookies, therefore we must know the
				// intended user
				throw new Exception("name parameter not provided");
			}
			if( false == name.equals( userNameAndPassword[0] ) ) {
				// The funny (interesting) situation has occurred.
				// Send back a 401 to get intended name and password
				rejectRequest(response);
				return;
			}
		}
		
		// From this point on, an auth has been provided for an intended
		// user. We do not want to return an error or else a pop-up box 
		// from the browser (not javascript) will be displayed. Even if 
		// login fails, return an OK status. The outcome of the login is 
		// returned as a JSON object. Also, the cookie installed on the 
		// client reflects a default user if the authentication fails.

		User user;
		boolean loggedIn = false;
		try {
			user = userRepository.authenticate(userNameAndPassword[0],userNameAndPassword[1]);
			loggedIn = true;
		} catch (Exception e) {
			
			logger.info("Failing to authenticate user",e);

			// Use default user in case of invalid authentication
			user = userRepository.getDefaultUser();
		}
		
		logger.info("user: "+user);
		acceptRequest(response, loggedIn, user);
	}

	private void performLogout(HttpServletRequest request, HttpServletResponse response) throws Exception {

		// Get name if provided
		String name = null;
		{
			String[] nameParams = request.getParameterValues("name");
			if( null != nameParams ) {
				if( nameParams.length > 1 ) {
					throw new Exception("'name' parameter provided multiple times");
				}
				if( nameParams.length < 1 ) {
					throw new Exception("'name' parameter not provided");
				}
				name = nameParams[0];
			}
		}
		
		// Get authorization
		String auth = request.getHeader("Authorization");
		
		logger.info("Logout authorization: "+auth);
		
		if( null == auth ) {
			// Reject response but do not change cookie: we have
			// not logged out yet
			AuthenticationUtils.sendAuthRequiredError(response, realm);
			return;
		}
		
		String[] userNameAndPassword = null;
		try {
			userNameAndPassword = AuthenticationUtils.getUserNameAndPassword(auth);
		} catch (Exception e) {
			throw new Exception("Unable to acquire user",e);
		}

		// An auth has been provided. Check that the auth corresponds to
		// the 'name' provided by the script. This is to avoid a situation
		// where the browser has changed its tokens, already learned from
		// the fact that this path is protected and supplies already known
		// credentials, ignoring the username and password provided in the
		// XmlHttpRequest
		
		if( false == name.equals( userNameAndPassword[0] ) ) {
			// The funny (interesting) situation has occurred.
			// Send back a 401 to get intended name and password
			// Reject response but do not change cookie: we have
			// not logged out yet
			AuthenticationUtils.sendAuthRequiredError(response, realm);
			return;
		}
		
		// From this point on, an auth has been provided. We do not want
		// to return an error or else a pop-up box from the browser (not
		// javascript) will be displayed. At this point, we are logging out
		// so we are expecting bogus credentials and we should not check
		// them. Accept request as default user.
		
		User user = userRepository.getDefaultUser();
		acceptRequest(response, false, user);
	}

	/**
	 * Performs full authentication checking. This method performs regular
	 * authentication checking, as if a filter had been installed for a resource
	 * and that the resource was accessed.
	 * @param request
	 * @param response
	 * @throws ServletException
	 * @throws IOException
	 */
	private void performTest(HttpServletRequest request, HttpServletResponse response) throws Exception {

		Authentication auth = new Authentication(userRepository);
		auth.setAllowAll(true);
		
		AuthenticationResult authResult = auth.authenticateFromRequest(request);
		if( authResult.allowed ) {
			acceptRequest(response, true, authResult.user);
			
		} else {
			rejectRequest(response);
		}
	}

	private void setUserCookie(HttpServletResponse response, boolean loggedIn, User user) throws Exception {
		String userJson = AuthenticationUtils.userToCookieString(loggedIn, user);
		
		Cookie cookie = new Cookie("nunaliit-auth",userJson);
		cookie.setPath("/");
		response.addCookie(cookie);
	}
	
	private void acceptRequest(HttpServletResponse response, boolean loggedIn, User user) throws Exception {
		
		// Set cookie with user info
		setUserCookie(response, loggedIn, user);

		// Send user in response
		sendUserResponse(response, loggedIn, user);
	}
	
	private void rejectRequest(HttpServletResponse response) throws Exception {
		// Inform client that authentication is required. Reset cookie with
		// default user.
		setUserCookie(response, false, userRepository.getDefaultUser());

		AuthenticationUtils.sendAuthRequiredError(response, realm);
	}

	private void sendUserResponse(HttpServletResponse response, boolean loggedIn, User user) throws Exception {

		response.setStatus(HttpServletResponse.SC_OK);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");

		JSONObject userJson = user.toJSON();
		
		JSONObject result = new JSONObject();
		result.put("user", userJson);
		result.put("logged", loggedIn);

		OutputStreamWriter osw = new OutputStreamWriter( response.getOutputStream(), "UTF-8" );
		result.write(osw);
		osw.flush();
	}
	
	private void sendErrorResponse(HttpServletResponse response, Throwable error) throws ServletException {

		response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");
		
		try {
			JSONObject result = new JSONObject();
			result.put("error", errorToJson(error));
			
			OutputStreamWriter osw = new OutputStreamWriter( response.getOutputStream(), "UTF-8" );
			result.write(osw);
			osw.flush();
		} catch(Exception e) {
			throw new ServletException("Failure while generating error",e);
		}
	}
	
	private JSONObject errorToJson(Throwable error) throws Exception {

		JSONObject errorObj = new JSONObject();
		errorObj.put("message", error.getMessage());
		if( null != error.getCause() ) {
			errorObj.put("cause", errorToJson(error.getCause()));
		}
		return errorObj;
	}
}
