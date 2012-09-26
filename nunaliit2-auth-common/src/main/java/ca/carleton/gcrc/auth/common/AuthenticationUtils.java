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
package ca.carleton.gcrc.auth.common;

import java.io.IOException;
import java.io.StringWriter;
import java.net.URLEncoder;
import java.security.Principal;
import java.util.Date;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import org.apache.commons.codec.binary.Base64;

import ca.carleton.gcrc.auth.common.impl.AuthPrincipal;

public class AuthenticationUtils {
	/**
	 * This method takes the auth string from found in a HTTP request
	 * header (Authorization) and returns the name and password. 
	 * @param auth Value of the Authorization HTTP header
	 * @return Array of username and password
	 * @throws Exception
	 */
	static public String[] getUserNameAndPassword(String auth) throws Exception {

		auth = auth.trim();
		String[] components = auth.split("\\s+");
		if( components.length > 0 ) {
			if( "basic".equalsIgnoreCase(components[0].trim()) ) {
				// Basic authentication was used, second word is uuencoded
				if( components.length > 1 ) {
					String encoded = components[1];

					byte[] decoded = Base64.decodeBase64( encoded.getBytes() );
					StringWriter sw = new StringWriter();
					for(int loop=0; loop<decoded.length; ++loop) {
						sw.write((int)decoded[loop]);
					}

					String userAndPass = sw.toString();
					String[] tokens = userAndPass.trim().split(":");
					
					if( tokens.length < 2 ) {
						throw new Exception("Unable to decode name from basic authorization");
					}
					
					return tokens;
				} else {
					throw new Exception("Invalid authorization using Basic encoding");
				}
			}
		}
		
		throw new Exception("Unknown authorization type: "+auth);
	}

	/**
	 * Sends a response to the client stating that authorization is required.
	 * @param response Response used to send error message
	 * @param realm Realm that client should provide authorization for
	 * @throws IOException
	 */
	static public void sendAuthRequiredError(HttpServletResponse response, String realm) throws IOException {
		response.setHeader("WWW-Authenticate", "Basic realm=\""+realm+"\"");
		response.setHeader("Cache-Control", "no-cache,must-revalidate");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authorization Required");
	}

	/**
	 * Converts an instance of User to JSON object, fit for a cookie
	 * @param user Instance of User to convert
	 * @return JSON string containing the user state
	 * @throws Exception 
	 */
	static public String userToCookieString(boolean loggedIn, User user) throws Exception {
		JSONObject cookieObj = new JSONObject();
		
		cookieObj.put("logged", loggedIn);
		
		JSONObject userObj = user.toJSON();
		cookieObj.put("user", userObj);
		
		StringWriter sw = new StringWriter();
		cookieObj.write(sw);
		String cookieRaw = sw.toString();
		
		String cookieStr = URLEncoder.encode(cookieRaw,"UTF-8");
		cookieStr = cookieStr.replace("+", "%20");
		
		return cookieStr;
	}

	static public User getUserFromRequest(HttpServletRequest request) throws Exception {
		Principal principal = request.getUserPrincipal();
		if( null == principal ) {
			throw new Exception("No user specified");
		}
		User user = null;
		if( principal instanceof AuthPrincipal ) {
			user = ((AuthPrincipal)principal).getUser();
		} else {
			throw new Exception("Unable to retrieve user from principal");
		}
		return user;
	}
}
