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

import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.util.Date;

import org.apache.commons.codec.binary.Base64;

import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.auth.common.UserRepository;

public class CookieAuthentication {

	static private byte[] nonce = { 
		(byte)'o',(byte)'l',(byte)'k',(byte)'i',(byte)'t'
		,(byte)'-',(byte)'a',(byte)'u',(byte)'t',(byte)'h'
		};
	static protected byte[] secret = null; // protected for testing
	synchronized static private byte[] getSecret() throws Exception {
		if( null == secret ) {
			Date now = new Date();
			long nowValue = now.getTime();
			
			byte[] nowBytes = new byte[8];
			nowBytes[0] = (byte)((nowValue >>  0) & 0xff);
			nowBytes[1] = (byte)((nowValue >>  8) & 0xff);
			nowBytes[2] = (byte)((nowValue >> 16) & 0xff);
			nowBytes[3] = (byte)((nowValue >> 24) & 0xff);
			nowBytes[4] = (byte)((nowValue >> 32) & 0xff);
			nowBytes[5] = (byte)((nowValue >> 40) & 0xff);
			nowBytes[6] = (byte)((nowValue >> 48) & 0xff);
			nowBytes[7] = (byte)((nowValue >> 56) & 0xff);
			
			MessageDigest md = MessageDigest.getInstance("SHA");
			md.update( nonce );
			md.update( nowBytes );
			secret = md.digest();
		}
		
		return secret;
	}

	static public String createAuthToken(User user) throws Exception {
		
		int userId = user.getId();
		
		// Convert int to byte array
		byte[] userIdBytes = new byte[4];
		userIdBytes[0] = (byte)(userId & 0xff);
		userIdBytes[1] = (byte)((userId >> 8) & 0xff);
		userIdBytes[2] = (byte)((userId >> 16) & 0xff);
		userIdBytes[3] = (byte)((userId >> 24) & 0xff);
		
		// Create a token by digesting the user id and secret.
		// - userId ensures that token is different for each user
		// - secret ensures that token is generated from this
		//   class
		MessageDigest md = MessageDigest.getInstance("SHA");
		md.update( getSecret() );
		md.update( userIdBytes );
		byte[] digest = md.digest();
		
		// Token is BASE64 of digest
		byte[] tokenBytes = Base64.encodeBase64(digest);
		String authToken = new String(tokenBytes);
		
		return authToken;
	}

	static public void verifyAuthToken(User user, String authToken) throws Exception {
		
		// Compute auth token
		String challenge = createAuthToken(user);
		if( false == challenge.equals(authToken) ) {
			throw new Exception("Invalid authentication token for user: "+user.getId()+" "+authToken+"*"+challenge);
		}
	}
	
	static public String computeCookieString(User user) throws Exception {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		// Version
		pw.print("0|");
		
		// User id
		pw.print(user.getId());
		pw.print("|");

		// Authentication token
		String authToken = createAuthToken(user);
		pw.print(authToken);
		
		pw.flush();
		String raw = sw.toString();
		
		String encoded = URLEncoder.encode(raw, "UTF-8");

		return encoded;
	}
	
	static public User verifyCookieString(UserRepository userRepository, String encodedCookie) throws Exception {
		
		String cookieString = URLDecoder.decode(encodedCookie, "UTF-8");
		
		// Break up cookie string into:
		// -version
		// -user id
		// -auth token
		int version = 0;
		int userId = 0;
		String authToken = null;
		{
			String[] parts = cookieString.split("\\|");
			if( 3 != parts.length ) {
				throw new Exception("Unrecognized auth cookie string");
			}
			version = Integer.parseInt(parts[0]);
			userId = Integer.parseInt(parts[1]);
			authToken = parts[2];
		}
		
		// Check version
		if( 0 != version ) {
			throw new Exception("Unknown version of auth cookie string");
		}
		
		// Get user
		User user = null;
		{
			user = userRepository.userFromId(userId);
			if( null == user ) {
				throw new Exception("Can not find user from auth cookie string");
			}
		}
		
		// Verify token
		verifyAuthToken(user, authToken);
		
		return user;
	}
}
