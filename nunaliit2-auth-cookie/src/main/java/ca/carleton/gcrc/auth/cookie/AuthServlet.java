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
package ca.carleton.gcrc.auth.cookie;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.auth.common.AuthenticationUtils;
import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.auth.common.UserRepositorySingleton;
import ca.carleton.gcrc.auth.cookie.impl.CookieAuthentication;

public class AuthServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private static final String defaultCookieName = "olkit-auth";

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private UserRepository userRepository;
	private String cookieName = defaultCookieName;
	
	public AuthServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);

		{
			String value = config.getInitParameter("cookie");
			if( null != value ) {
				this.cookieName = value;
			}
		}
		
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
				
			} else if( "adjust".equalsIgnoreCase(path) ) {
				performAdjustCookies(request, response);
				
			} else {
				throw new Exception("Unknown request: "+path);
			}
			
//		} catch(SetUserException e) {
//			logger.info("Error(setUser) encountered while performing: "+path,e);
//			try {
//				setUserCookie(response, false, e.getUser());
//			} catch (Exception e1) {
//				// Ignored
//			}
//			sendErrorResponse(response, e);

		} catch(Exception e) {
			logger.info("Error encountered while performing: "+path,e);
			sendErrorResponse(response, e);
		}
	}
	
	private void performLogin(HttpServletRequest request, HttpServletResponse response) throws Exception {
		
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
		
		// Get password if provided
		String password = null;
		{
			String[] params = request.getParameterValues("password");
			if( null != params ) {
				if( params.length > 1 ) {
					throw new Exception("password parameter provided multiple times");
				}
				if( params.length == 1 ) {
					password = params[0];
				}
			}
		}
		
		if( null == name || null == password ) {
			throw new Exception("name or password missing");
		}
		
		User user;
		try {
			user = userRepository.authenticate(name,password);
		} catch (Exception e) {
			throw new Exception("Invalid credentials");
		}
		
		logger.info("user: "+user);
		acceptRequest(response, true, user);
	}

	private void performLogout(HttpServletRequest request, HttpServletResponse response) throws Exception {

		User user = userRepository.getDefaultUser();
		acceptRequest(response, false, user);
	}

	/**
	 * Adjusts the information cookie based on the authentication token
	 * @param request
	 * @param response
	 * @throws ServletException
	 * @throws IOException
	 */
	private void performAdjustCookies(HttpServletRequest request, HttpServletResponse response) throws Exception {

		boolean loggedIn = false;
		User user = null;
		try {
			Cookie cookie = getCookieFromRequest(request);
			if( null != cookie ) {
				user = CookieAuthentication.verifyCookieString(userRepository, cookie.getValue());
				loggedIn = true;
			}
		} catch(Exception e) {
			// Ignore
		}
		
		if( null == user ) {
			user = userRepository.getDefaultUser();
		}
		
		acceptRequest(response, loggedIn, user);
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
		
		// Set auth token
		{
			String value = CookieAuthentication.computeCookieString(user);
			Cookie cookie = new Cookie(cookieName,value);
			cookie.setPath("/");
			response.addCookie(cookie);
		}

		// Send user in response
		sendUserResponse(response, loggedIn, user);
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
			throw new ServletException("Failure generating an error",e);
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

	private Cookie getCookieFromRequest(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		
		// Loop through cookies, looking for ours
		Cookie authCookie = null;
		for(Cookie cookie : cookies) {
			if( cookieName.equals( cookie.getName() ) ) {
				authCookie = cookie;
				break;
			}
		}
		
		return authCookie;
	}
}
