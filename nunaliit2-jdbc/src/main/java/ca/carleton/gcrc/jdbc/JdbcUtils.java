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
package ca.carleton.gcrc.jdbc;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;

public class JdbcUtils {

	/**
	 * This method converts a string into a new one that is safe for
	 * a SQL query. It deals with strings that are expected to be string
	 * values. 
	 * @param in Original string
	 * @return Safe string for a query.
	 * @throws Exception 
	 */
	static public String safeSqlQueryStringValue(String in) throws Exception {
		if( null == in ) {
			return "NULL";
		}
		if( in.indexOf('\0') >= 0 ) {
			throw new Exception("Null character found in string value");
		}
		// All quotes should be escaped
		in = in.replace("'", "''");
		
		// Add quotes again
		return "'" + in + "'";
	}
	
	/**
	 * This method converts a string into a new one that is safe for
	 * a SQL query. It deals with strings that are expected to be integer
	 * values. 
	 * @param in Original string
	 * @return Safe string for a query.
	 */
	static public String safeSqlQueryIntegerValue(String in) throws Exception {
		int intValue = Integer.parseInt(in);
		
		return ""+intValue;
	}
	
	/**
	 * This method converts a string into a new one that is safe for
	 * a SQL query. It deals with strings that are supposed to be
	 * identifiers. 
	 * @param in Original string
	 * @return Safe string for a query.
	 * @throws Exception 
	 */
	static public String safeSqlQueryIdentifier(String in) throws Exception {
		if( null == in ) {
			throw new Exception("Null string passed as identifier");
		}
		if( in.indexOf('\0') >= 0 ) {
			throw new Exception("Null character found in identifier");
		}
		
		// All quotes should be escaped
		in = in.replace("\"", "\"\"");
		
		in = "\"" + in + "\"";

		return in;
	}
	
	/**
	 * This method returns a String result at a given index. 
	 * @param stmt Statement that has been successfully executed
	 * @param index Index of expected column
	 * @return A string returned at the specified index
	 * @throws Exception If there is no column at index 
	 */
	static public String extractStringResult(ResultSet rs, ResultSetMetaData rsmd, int index) throws Exception {

		int count = rsmd.getColumnCount();
		if( index > count || index < 1 ) {
			throw new Exception("Invalid index");
		}
		
		int type = rsmd.getColumnType(index);
		switch (type) {
			case java.sql.Types.VARCHAR:
			case java.sql.Types.CHAR:
				return rs.getString(index);
		}

		throw new Exception("Column type ("+type+") invalid for a string at index: "+index);
	}
	
	
	/**
	 * This method returns an int result at a given index. 
	 * @param stmt Statement that has been successfully executed
	 * @param index Index of expected column
	 * @return A value returned at the specified index
	 * @throws Exception If there is no column at index 
	 */
	static public int extractIntResult(ResultSet rs, ResultSetMetaData rsmd, int index) throws Exception {

		int count = rsmd.getColumnCount();
		if( index > count || index < 1 ) {
			throw new Exception("Invalid index");
		}
		
		int type = rsmd.getColumnType(index);
		switch (type) {
			case java.sql.Types.INTEGER:
			case java.sql.Types.SMALLINT:
				return rs.getInt(index);
		}

		throw new Exception("Column type ("+type+") invalid for a string at index: "+index);
	}

}
