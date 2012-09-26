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

import java.net.URLDecoder;
import java.net.URLEncoder;

import ca.carleton.gcrc.auth.common.User;
import junit.framework.TestCase;

public class CookieAuthenticationTest extends TestCase {

	public void testComputeCookieString() throws Exception {
		MockUserRepository userRepository = new MockUserRepository();
		
		CookieAuthentication.computeCookieString( userRepository.getAdmin() );
		CookieAuthentication.computeCookieString( userRepository.getAnonymous() );
		CookieAuthentication.computeCookieString( userRepository.getRegular1() );
		CookieAuthentication.computeCookieString( userRepository.getRegular2() );
	}

	public void testVerifyCookieString() throws Exception {
		MockUserRepository userRepository = new MockUserRepository();
		
		{
			String cookieString = 
				CookieAuthentication.computeCookieString( userRepository.getAdmin() );
			User user = CookieAuthentication.verifyCookieString(userRepository, cookieString);
			if( user != userRepository.getAdmin() ) {
				fail("Unexpected user for admin");
			}
		}
		
		{
			String cookieString = 
				CookieAuthentication.computeCookieString( userRepository.getAnonymous() );
			User user = CookieAuthentication.verifyCookieString(userRepository, cookieString);
			if( user != userRepository.getAnonymous() ) {
				fail("Unexpected user for anonymous");
			}
		}
		
		{
			String cookieString = 
				CookieAuthentication.computeCookieString( userRepository.getRegular1() );
			User user = CookieAuthentication.verifyCookieString(userRepository, cookieString);
			if( user != userRepository.getRegular1() ) {
				fail("Unexpected user for regular 1");
			}
		}
		
		{
			String cookieString = 
				CookieAuthentication.computeCookieString( userRepository.getRegular2() );
			User user = CookieAuthentication.verifyCookieString(userRepository, cookieString);
			if( user != userRepository.getRegular2() ) {
				fail("Unexpected user for regular 2");
			}
		}
	}

	public void testInvalidCookieStringVersion() throws Exception {
		MockUserRepository userRepository = new MockUserRepository();

		// Get valid cookie string
		String cookieString = 
			CookieAuthentication.computeCookieString( userRepository.getAdmin() );
		
		// Recreate cookie string with invalid version
		String invalidCookieString = null;
		{
			String[] parts = URLDecoder.decode(cookieString,"UTF-8").split("\\|");
			if( 3 != parts.length ) {
				fail("Invalid test.");
			}
			invalidCookieString = URLEncoder.encode("99|"+parts[1]+"|"+parts[2],"UTF-8");
		}
		
		// Check that exception is thrown
		try {
			CookieAuthentication.verifyCookieString(userRepository, invalidCookieString);
			
			fail("Exception should be thrown on an invalid version");
		} catch(Exception e) {
			// OK
		}
	}

	public void testInvalidUserId() throws Exception {
		MockUserRepository userRepository = new MockUserRepository();

		// Get valid cookie string
		String cookieString = 
			CookieAuthentication.computeCookieString( userRepository.getAdmin() );
		
		// Recreate cookie string with invalid user id
		String invalidCookieString = null;
		{
			String[] parts = URLDecoder.decode(cookieString,"UTF-8").split("\\|");
			if( 3 != parts.length ) {
				fail("Invalid test.");
			}
			invalidCookieString = URLEncoder.encode(parts[0]+"|999|"+parts[2],"UTF-8");
		}
		
		// Check that exception is thrown
		try {
			CookieAuthentication.verifyCookieString(userRepository, invalidCookieString);
			
			fail("Exception should be thrown on an invalid user id");
		} catch(Exception e) {
			// OK
		}
	}

	public void testInvalidToken() throws Exception {
		MockUserRepository userRepository = new MockUserRepository();

		// Get two valid cookie strings
		String cookieString1 = 
			CookieAuthentication.computeCookieString( userRepository.getAdmin() );
		String cookieString2 = 
			CookieAuthentication.computeCookieString( userRepository.getRegular1() );
		
		// Recreate cookie string with invalid token
		String invalidCookieString = null;
		{
			String[] parts1 = URLDecoder.decode(cookieString1,"UTF-8").split("\\|");
			if( 3 != parts1.length ) {
				fail("Invalid test.");
			}
			String[] parts2 = URLDecoder.decode(cookieString2,"UTF-8").split("\\|");
			if( 3 != parts2.length ) {
				fail("Invalid test.");
			}
			invalidCookieString = URLEncoder.encode(parts1[0]+"|"+parts2[1]+"|"+parts1[2],"UTF-8");
		}
		
		// Check that exception is thrown
		try {
			CookieAuthentication.verifyCookieString(userRepository, invalidCookieString);
			
			fail("Exception should be thrown on an invalid token");
		} catch(Exception e) {
			// OK
		}
	}

	public void testSecretHasChanged() throws Exception {
		// This simulates that the server was rebooted since the
		// secret is different on each boot (every time the CookieAuthentication
		// is loaded)
		
		MockUserRepository userRepository = new MockUserRepository();

		// Get valid cookie string
		String cookieString = 
			CookieAuthentication.computeCookieString( userRepository.getAdmin() );
		
		// Reset secret
		{
			// Let time elapse to get a different secret (10 ms)
			Thread.sleep(10);
			CookieAuthentication.secret = null;
		}
		
		// Check that exception is thrown
		try {
			CookieAuthentication.verifyCookieString(userRepository, cookieString);
			
			fail("Exception should be thrown on a reboot");
		} catch(Exception e) {
			// OK
		}
	}
}
