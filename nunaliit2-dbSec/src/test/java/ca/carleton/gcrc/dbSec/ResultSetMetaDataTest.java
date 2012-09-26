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
package ca.carleton.gcrc.dbSec;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

import junit.framework.TestCase;

public class ResultSetMetaDataTest extends TestCase {

	static public _Conf conf = _Conf.getConfiguration();
	
	public void printTableMetaData(String name) throws Exception {
		Connection conn = conf.getTestConnection();
		Statement stmt = conn.createStatement();
		if( stmt.execute("SELECT * FROM "+name+" LIMIT 1;") ) {
			ResultSet rs = stmt.getResultSet();
			ResultSetMetaData rsmd = rs.getMetaData();
			for(int loop=1; loop<=rsmd.getColumnCount(); ++loop) {
				String columnName = rsmd.getColumnName(loop);
				String catalogName = rsmd.getCatalogName(loop);
				String columnClassName = rsmd.getColumnClassName(loop);
				String columnLabel = rsmd.getColumnLabel(loop);
				String columnTypeName = rsmd.getColumnTypeName(loop);
				String schemaName = rsmd.getSchemaName(loop);
				String tableName = rsmd.getTableName(loop);
				int columnDisplaySize = rsmd.getColumnDisplaySize(loop);
				int precision = rsmd.getPrecision(loop);
				int columnType = rsmd.getColumnType(loop);
				int scale = rsmd.getScale(loop);
				int isNullable = rsmd.isNullable(loop);
				boolean isAutoIncrement = rsmd.isAutoIncrement(loop);
				boolean isCaseSensitive = rsmd.isCaseSensitive(loop);
				boolean isCurrency = rsmd.isCurrency(loop);
				boolean isDefinitelyWritable = rsmd.isDefinitelyWritable(loop);
				boolean isReadOnly = rsmd.isReadOnly(loop);
				boolean isSearchable = rsmd.isSearchable(loop);
				boolean isSigned = rsmd.isSigned(loop);
				boolean isWritable = rsmd.isWritable(loop);
				
				System.out.print(""+columnName);
				System.out.print(":"+catalogName);
				System.out.print(":"+columnClassName);
				System.out.print(":"+columnLabel);
				System.out.print(":"+columnTypeName);
				System.out.print(":"+schemaName);
				System.out.print(":"+tableName);
				System.out.print(":"+columnDisplaySize);
				System.out.print(":"+precision);
				System.out.print(":"+columnType);
				System.out.print(":"+scale);
				System.out.print(":"+isNullable);
				System.out.print((isAutoIncrement?" autoIncrement":""));
				System.out.print((isCaseSensitive?" caseSensitive":""));
				System.out.print((isCurrency?" currency":""));
				System.out.print((isDefinitelyWritable?" definitelyWritable":""));
				System.out.print((isReadOnly?" readOnly":""));
				System.out.print((isSearchable?" searchable":""));
				System.out.print((isSigned?" signed":""));
				System.out.print((isWritable?" writable":""));
				System.out.println();
			}
		} else {
			throw new Exception("Expected a result");
		}
	}

	public void testGetMetaDataNames() throws Exception {
		if( conf.isPerformingTests() ) {
			printTableMetaData("features");
		}
	}
}
