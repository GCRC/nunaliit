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

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import ca.carleton.gcrc.dbSec.impl.ColumnDataImpl;
import ca.carleton.gcrc.dbSec.impl.ColumnDataUtils;
import ca.carleton.gcrc.dbSec.impl.ColumnOptionsParser;
import ca.carleton.gcrc.dbSec.impl.TableSchemaImpl;
import ca.carleton.gcrc.dbSec.table.TableOptionsParser;

/**
 * Computes access to various portion of a database based
 * on a user's privileges. This class determines access based
 * on:
 * 1. Meta data returned from tables
 * 2. A table name to view mapping table called 'dbsec_tables'
 * 3. A column security table called 'dbsec_columns'
 *
 */
public class DbSecurity {
	
	static final private String DB_NAME_TABLES = "dbsec_tables";
	static final private String DB_NAME_COLUMNS = "dbsec_columns";

	private Connection connection;

	public DbSecurity(Connection connection) {
		this.connection = connection;
	}
	
	public Connection getConnection() {
		return connection;
	}

	/**
	 * Computes from the database the access to a table for a given user. In 
	 * this call, a user is represented by the set of groups it belongs to.
	 * @param tableName Name of the table to be queried
	 * @param user User requesting access to the schema
	 * @return An object that represents available access to a table. Null if the table
	 * not available.
	 * @throws Exception
	 */
	public TableSchema getTableSchemaFromName(String tableName, DbUser user) throws Exception {
		List<String> tableNames = new Vector<String>();
		tableNames.add(tableName);
		
		Map<String,TableSchemaImpl> nameToTableMap = getTableDataFromGroups(user,tableNames);
		
		if( false == nameToTableMap.containsKey(tableName) ) {
			throw new Exception("A table named '"+tableName+"' does not exist or is not available");
		}

		return nameToTableMap.get(tableName);
	}
	
	/**
	 * Computes from the database the access to all tables for a given user. In 
	 * this call, a user is represented by the set of groups it belongs to.
	 * @param user User requesting access to the database
	 * @return An list that represents available access to all visible tables.
	 * @throws Exception
	 */
	public List<TableSchema> getAvailableTablesFromGroups(DbUser user) throws Exception {
		Map<String,TableSchemaImpl> nameToTableMap = getTableDataFromGroups(user,null);
		
		List<TableSchema> result = new Vector<TableSchema>();
		result.addAll(nameToTableMap.values());
		return result;
	}
	
	/**
	 * Computes from the database the access to all requested tables for a given user. In 
	 * this call, a user is represented by the set of groups it belongs to. This method uses
	 * the table 'dbsec_tables' to figure out which tables are available to a user. Then,
	 * it calls other methods which use 'dbsec_columns' and metadata from each table.
	 * @param user User requesting access to the database
	 * @param logicalNames Null if querying all tables. List of tables if only a subset is
	 * required.
	 * @return A map of all table data queried from the database.
	 * @throws Exception
	 */
	private Map<String,TableSchemaImpl> getTableDataFromGroups(DbUser user, List<String> logicalNames) throws Exception {
		Map<String,TableSchemaImpl> nameToTableMap = new HashMap<String,TableSchemaImpl>();
		
		if( null == user ) {
			throw new Exception("No user supplied");
		}
		if( null != logicalNames && 0 == logicalNames.size() ) {
			throw new Exception("Empty table list supplied");
		}

		List<Integer> groups = user.getGroups();
		if( null == groups || 0 == groups.size() ) {
			// Nothing to do
			return new HashMap<String,TableSchemaImpl>();
		}
		
		String sqlQuery = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("SELECT id,logical_name,physical_name,group_id,options FROM "+DB_NAME_TABLES+" WHERE (");
			boolean first = true;
			for(Integer groupId : groups) {
				if( first ) {
					first = false;
				} else {
					pw.print(" OR ");
				}
				pw.print("(group_id = ");
				pw.print(groupId.intValue());
				pw.print(")");
			}
			if( null != logicalNames ) {
				pw.print(") AND (");
				
				first = true;
				for(String logicalName : logicalNames) {
					if( first ) {
						first = false;
					} else {
						pw.print(" OR ");
					}
					pw.print("(logical_name = '");
					pw.print(logicalName);
					pw.print("')");
				}
			}
			pw.print(") ORDER BY priority DESC;");
			pw.flush();
			
			sqlQuery = sw.toString();
		}
		
		Statement stmt = connection.createStatement();
		if( stmt.execute(sqlQuery) ) {
			ResultSet rs = stmt.getResultSet();
			while( rs.next() ) {
				//int id = rs.getInt(1);
				String logicalName = rs.getString(2);
				String physicalName = rs.getString(3);
				int groupId = rs.getInt(4);
				String options = rs.getString(5);
				
				TableSchemaImpl tableData = nameToTableMap.get(logicalName);
				if( null == tableData ) {
					tableData = new TableSchemaImpl();
					tableData.setLogicalName(logicalName);
					tableData.setPhysicalName(physicalName);
					tableData.setGroupId(groupId);
					try {
						TableOptionsParser.parseTableOptions(options, tableData);
					} catch (Exception e) {
						try {
							stmt.close();
						} catch(Exception e1) {
							// Ignore
						}
						throw e;
					}
					nameToTableMap.put(logicalName, tableData);
				}
			}
		}
		
		stmt.close();
		
		// Get column restrictions
		retrieveColumnData(nameToTableMap.values());
		
		// Get column types
		for(TableSchemaImpl tableData : nameToTableMap.values()) {
			retrieveColumnTypes(tableData);
		}
		
		return nameToTableMap;
	}
	
	/**
	 * For a set of tables, retrieves access to columns specified in the security tables.
	 * This method uses the table 'dbsec_columns' to perform this work. The resulting information
	 * in the column data is incomplete: it lacks types and other elements.
	 * @param tableDataSet Tables to query
	 * @throws Exception
	 */
	private void retrieveColumnData(Collection<TableSchemaImpl> tableDataSet) throws Exception {

		for(TableSchemaImpl tableData : tableDataSet) {
			retrieveColumnData(tableData);
		}
	}
	
	/**
	 * For a table, retrieves access to columns specified in the security tables.
	 * This method uses the table 'dbsec_columns' to perform this work. The resulting information
	 * in the column data is incomplete: it lacks types and other elements.
	 * @param tableData Table to query
	 * @throws Exception
	 */
	private void retrieveColumnData(TableSchemaImpl tableData) throws Exception {
		String logicalName = tableData.getLogicalName();
		int groupId = tableData.getGroupId();

		try {
			
			PreparedStatement ps = connection.prepareStatement(
					"SELECT column_name,read,write,options " +
					"FROM "+DB_NAME_COLUMNS+
					" WHERE logical_name = ? AND group_id = ?");
			ps.setString(1, logicalName);
			ps.setInt(2, groupId);
			if( ps.execute() ) {
				ResultSet rs = ps.getResultSet();
				while( rs.next() ) {
					String columnName = rs.getString(1);
					boolean read = rs.getBoolean(2);
					boolean write = rs.getBoolean(3);
					String options = rs.getString(4);

					ColumnDataImpl columnDataImpl = tableData.createColumnDataFromName(columnName);
					columnDataImpl.setReadable(read);
					columnDataImpl.setWriteable(write);
					ColumnOptionsParser.parseColumnOptions(options, columnDataImpl);
				}
			}
			ps.close();
		} catch (Exception e) {
			throw new Exception("Error retrieving column data for: "+logicalName+"/"+groupId,e);
		}
	}
	
	/**
	 * For a given table, queries the database for all available columns. It
	 * also derives the column type. This method performs a SQL select * on the
	 * requested table and uses the metadata returned in JDBC to populate the
	 * column information.
	 * @param tableData Table to query
	 * @throws Exception
	 */
	private void retrieveColumnTypes(TableSchemaImpl tableData) throws Exception {

		String sqlQuery = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("SELECT * FROM ");
			pw.print( tableData.getPhysicalName() );
			pw.print(" LIMIT 1;");
			pw.flush();
			
			sqlQuery = sw.toString();
		}
		
		Statement stmt = connection.createStatement();
		if( stmt.execute(sqlQuery) ) {
			ResultSet rs = stmt.getResultSet();
			ResultSetMetaData rsmd = rs.getMetaData();
			
			int count = rsmd.getColumnCount();
			for(int loop=0; loop<count; ++loop) {
				String columnName = rsmd.getColumnName(loop+1);
				int sqlType = rsmd.getColumnType(loop+1);
				String sqlTypeName = rsmd.getColumnTypeName(loop+1);

				ColumnDataImpl columnDataImpl = tableData.createColumnDataFromName( columnName );
				
				ColumnData.Type colType = ColumnDataUtils.columnDataTypeFromSQLType(
						sqlType, columnName, sqlTypeName);
				
				// Set column type
				columnDataImpl.setColumnType(colType);
			}	
		}
	}
}
