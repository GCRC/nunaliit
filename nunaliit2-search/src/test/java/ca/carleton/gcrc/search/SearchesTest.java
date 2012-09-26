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
package ca.carleton.gcrc.search;

import java.sql.Connection;
import java.util.Properties;

import ca.carleton.gcrc.jdbc.JdbcConnections;
import junit.framework.TestCase;

public class SearchesTest extends TestCase {

	static private Connection testConnection = null;
	@SuppressWarnings("unused")
	static private Connection getTestConnection() throws Exception {
		if( null == testConnection ) {
			Properties props = new Properties();
			props.setProperty("kitikmeot", "org.postgresql.Driver|jdbc:postgresql:kitikmeot|postgres|postgres");
			//props.setProperty("kitikmeot", "org.postgresql.Driver|jdbc:postgresql://db.gcrc.carleton.ca/kitikmeot_dev|postgres|postgres");
			JdbcConnections jdbc = new JdbcConnections(props);
			testConnection = jdbc.getDb();
		}
		
		return testConnection;
	}
	
	public void testDummy() {}
	
//	public void testSearchNamesFromContent() throws Exception {
//		Connection conn = getTestConnection();
//		Searches searches = new Searches(new Properties(), conn);
//		
//		JSONObject result = searches.searchNamesFromContent("test");
//		System.out.print(result.toString());
//	}
}
