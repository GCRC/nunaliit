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
package ca.carleton.gcrc.jdbcJson;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

import java.util.Properties;

import ca.carleton.gcrc.jdbc.JdbcConnections;
import ca.carleton.gcrc.jdbc.JdbcUtils;

import junit.framework.TestCase;

@SuppressWarnings("unused")
public class JdbcDatabaseConnectionsTest extends TestCase {

	static private Connection testConnection = null;
	static private Connection getTestConnection() throws Exception {
		if( null == testConnection ) {
			Properties props = new Properties();
			props.setProperty("kitikmeot", "org.postgresql.Driver|jdbc:postgresql:kitikmeot|postgres|postgres");
			//props.setProperty("kitikmeot", "org.postgresql.Driver|jdbc:postgresql://db.gcrc.carleton.ca/kitikmeot_dev|postgres|postgres");
			JdbcConnections jdbc = new JdbcConnections(props);
			testConnection = jdbc.getDb("kitikmeot");
		}
		
		return testConnection;
	}
	
//	public void testKitikmeot() throws Exception {
//		JdbcDatabaseConnections jdbc = new JdbcDatabaseConnections();
//		Connection con = jdbc.getDb("kitikmeot");
//	}
	
//	public void testKitikmeot() throws Exception {
//		Properties props = new Properties();
//		props.setProperty("kitikmeot", "org.postgresql.Driver|jdbc:postgresql:kitikmeot|postgres|postgres");
//		//props.setProperty("kitikmeot", "org.postgresql.Driver|jdbc:postgresql://db.gcrc.carleton.ca/kitikmeot_dev|postgres|postgres");
//		JdbcDatabaseConnections jdbc = new JdbcDatabaseConnections(props);
//		Connection conn = jdbc.getDb("kitikmeot");
//		if( null == conn ) {
//			fail("No connection returned");
//		}
//	}
//	
//	public void testMetaData() throws Exception {
//		Connection conn = getTestConnection();
//		DatabaseMetaData metaData = conn.getMetaData();
//		ResultSet rs = metaData.getTableTypes();
//		
//
//	}

	public void testSafeSqlQueryStringValue() throws Exception {
		{
			String in = "test";
			if( false == "'test'".equals( JdbcUtils.safeSqlQueryStringValue(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "tes't";
			if( false == "'tes''t'".equals( JdbcUtils.safeSqlQueryStringValue(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "test'";
			if( false == "'test'''".equals( JdbcUtils.safeSqlQueryStringValue(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "'test'";
			if( false == "'''test'''".equals( JdbcUtils.safeSqlQueryStringValue(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "  test  ";
			if( false == "'  test  '".equals( JdbcUtils.safeSqlQueryStringValue(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = null;
			if( false == "NULL".equals( JdbcUtils.safeSqlQueryStringValue(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "null \0 test";
			try {
				JdbcUtils.safeSqlQueryStringValue(in);
				fail("Exception should be raised on a null char");
			} catch(Exception e) {
				// OK
			};
		}
	}

	public void testSafeSqlQueryIdentifier() throws Exception {
		{
			String in = "test";
			if( false == "\"test\"".equals( JdbcUtils.safeSqlQueryIdentifier(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "tes\"t";
			if( false == "\"tes\"\"t\"".equals( JdbcUtils.safeSqlQueryIdentifier(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "test\"";
			if( false == "\"test\"\"\"".equals( JdbcUtils.safeSqlQueryIdentifier(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "\"test\"";
			if( false == "\"\"\"test\"\"\"".equals( JdbcUtils.safeSqlQueryIdentifier(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = "  test  ";
			if( false == "\"  test  \"".equals( JdbcUtils.safeSqlQueryIdentifier(in) ) ) {
				fail(in);
			}
		}
		
		{
			String in = null;
			try {
				JdbcUtils.safeSqlQueryIdentifier(in);
				fail("Exception should be raised on a null identifier");
			} catch(Exception e) {
				// OK
			};
		}
		
		{
			String in = "null \0 test";
			try {
				JdbcUtils.safeSqlQueryIdentifier(in);
				fail("Exception should be raised on a null char");
			} catch(Exception e) {
				// OK
			};
		}
	}
	
	public void testDummy() {
		
	}
}
