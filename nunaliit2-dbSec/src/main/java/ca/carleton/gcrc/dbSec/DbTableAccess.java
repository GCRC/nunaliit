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
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.dbSec.impl.ColumnDataComparator;
import ca.carleton.gcrc.dbSec.impl.ColumnDataUtils;
import ca.carleton.gcrc.dbSec.impl.ExpressionConstantImpl;
import ca.carleton.gcrc.dbSec.impl.FieldSelectorComparator;
import ca.carleton.gcrc.dbSec.impl.RecordSelectorComparator;
import ca.carleton.gcrc.dbSec.impl.SqlElement;
import ca.carleton.gcrc.dbSec.impl.TypedValue;
import ca.carleton.gcrc.dbSec.impl.VariablesImpl;

/**
 * An instance of this class is used to control the operations that
 * a user can perform on a database table. The four basic operations
 * are implemented: query, insert, update, delete.
 * A table schema specific to the user is derived from permissions 
 * given on the database. From this schema, all operations are verified
 * before carried out.
 */
public class DbTableAccess {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	static private FieldSelectorComparator fieldSelectorComparator = new FieldSelectorComparator();

	static public DbTableAccess getAccess(DbSecurity dbSecurity, String tableName, DbUser user) throws Exception {
		TableSchema tableSchema = dbSecurity.getTableSchemaFromName(tableName, user);
		Connection connection = dbSecurity.getConnection();
		return new DbTableAccess(connection, tableSchema, user);
	}
	
	private Connection connection = null;
	private TableSchema tableSchema = null;
	private VariablesImpl variables = null;
	
	private DbTableAccess(Connection connection, TableSchema tableSchema, DbUser user) {
		this.connection = connection;
		this.tableSchema = tableSchema;
		
		variables = new VariablesImpl();
		variables.setUser(user);
	}

	/**
	 * Returns a JSON object that explains the capabilities that a given
	 * user has against a given table. 
	 * @return JSON object explaining the schema of the table.
	 * @throws Exception
	 */
	public JSONObject getSchema() throws Exception {
		return tableSchema.toJSON();
	}
	
	/**
	 * Allows a user to insert new data into a table, while respecting
	 * the schema and capabilities of the user.
	 * @param params Map of column names to their respective values
	 * @return JSON object representing the inserted object
	 * @throws Exception
	 */
	public JSONObject insert(Map<String, String> params) throws Exception {
		OperationAccess operationAccess = tableSchema.getInsertAccess();
		if( false == operationAccess.isAllowed() ) {
			throw new Exception("Attempting to insert a record while the privilege is not allowed: "+tableSchema.getLogicalName()+" ("+tableSchema.getPhysicalName()+")");
		}
		
		// Create a list of parameters to retrieve the row after it is
		// inserted
		List<RecordSelector> whereClauses = new Vector<RecordSelector>();

		// Create a list of all writable columns where a value is specified in
		// the parameters
		List<ColumnData> columnsWithParam = new Vector<ColumnData>();
		for(String columnName : params.keySet()) {
			ColumnData columnData = tableSchema.getColumnFromName(columnName);
			
			if( null != columnData && false == columnData.isWriteable() ) {
				columnData = null;
			}
			if( null != columnData && columnData.isAutoIncrementInteger() ) {
				columnData = null;
			}
			
			if( null == columnData ) {
				throw new Exception("No write access to column "+columnName+" in table "+tableSchema.getLogicalName()+" ("+tableSchema.getPhysicalName()+")");
			} else {
				columnsWithParam.add(columnData);
			}
		}
		
		// Get all columns that are auto fill
		List<ColumnData> autoIncrementIntegerColumns = new Vector<ColumnData>();
		for( ColumnData columnData : tableSchema.getColumns() ) {
			if( columnData.isAutoIncrementInteger() ) {
				autoIncrementIntegerColumns.add(columnData);
			}
		}
		
		// Get all columns that are assigned a value on insert
		List<ColumnData> valueAssignedColumns = new Vector<ColumnData>();
		for( ColumnData columnData : tableSchema.getColumns() ) {
			if( null != columnData.getAssignValueOnInsert() ) {
				valueAssignedColumns.add(columnData);
			} else if( null != columnData.getAssignVariableOnInsert() ) {
				valueAssignedColumns.add(columnData);
			}
		}
		
		// Sort according to column name. This offers greater reusability
		// of the prepared statement.
		Collections.sort(autoIncrementIntegerColumns,new ColumnDataComparator());
		Collections.sort(columnsWithParam,new ColumnDataComparator());
		Collections.sort(valueAssignedColumns,new ColumnDataComparator());
		
		// Obtain all auto increment integers
		List<Integer> autoIncrementIntegerValues = new Vector<Integer>();
		for( ColumnData autoIncrementIntegerColumn : autoIncrementIntegerColumns ) {
			int nextValue = ColumnDataUtils.obtainNextIncrementInteger(connection, autoIncrementIntegerColumn);
			Integer value = nextValue;
			autoIncrementIntegerValues.add( value );
			whereClauses.add(
				new RecordSelectorComparison(
					autoIncrementIntegerColumn.getColumnName()
					,RecordSelectorComparison.Comparison.EQUAL
					,new ExpressionConstantImpl(value.toString()) ) );
		}
		
		// Create SQL command
		String sqlQuery = null;
		PreparedStatement pstmt = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("INSERT INTO ");
			pw.print(tableSchema.getPhysicalName());
			pw.print(" (");
			boolean first = true;
			for(ColumnData columnData : autoIncrementIntegerColumns) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(columnData.getColumnName());
			}
			for(ColumnData columnData : columnsWithParam) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(columnData.getColumnName());
			}
			for(ColumnData columnData : valueAssignedColumns) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(columnData.getColumnName());
			}
			pw.print(") VALUES (");
			first = true;
			for(ColumnData columnData : autoIncrementIntegerColumns) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(columnData.getInsertWildcard());
			}
			for(ColumnData columnData : columnsWithParam) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(columnData.getInsertWildcard());
			}
			for(ColumnData columnData : valueAssignedColumns) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(columnData.getInsertWildcard());
			}
			pw.print(");");
			pw.flush();
			
			sqlQuery = sw.toString();
			pstmt = connection.prepareStatement(sqlQuery);
			
			// Populate prepared statement
			int index = 1;
			for(Integer integerValue : autoIncrementIntegerValues) {
				pstmt.setInt(index, integerValue.intValue());
				
				++index;
			}
			for(ColumnData columnData : columnsWithParam) {
				// Compute value
				String value = params.get(columnData.getColumnName());
				
				ColumnDataUtils.writeToPreparedStatement(pstmt, index, value, columnData.getColumnType());
				
				++index;
			}
			for(ColumnData columnData : valueAssignedColumns) {
				String value = columnData.getAssignValueOnInsert();
				if( null == value && null != columnData.getAssignVariableOnInsert() ) {
					value = variables.getVariableValue( columnData.getAssignVariableOnInsert() );
				}
				ColumnDataUtils.writeToPreparedStatement(pstmt, index, value, columnData.getColumnType());
				
				++index;
			}
		}
		
		// If there are no selector, there is no point in inserting the data since
		// we will not be able to retrieve it
		if( whereClauses.size() < 1 ) {
			throw new Exception("Refusing to insert data since it can not be selected: "+sqlQuery);
		}
		
		// Execute insert
		pstmt.execute();

		// Now, we need to retrieve the object
		JSONArray array = query(whereClauses, null, null,null,null,null);
		
		// In INSERT, we expect only one element in array
		if( 1 != array.length() ) {
			throw new Exception("Expected only one element returned in an INSERT. Returned size:"+array.length()+" sql: "+sqlQuery);
		}
		
		return array.getJSONObject(0);
	}
	
	/**
	 * Queries the database for a set of rows matching the given selectors. Returns the list
	 * of columns if specified. Returns all available columns if no columns are specified.
	 * @param recordSelectors List of record selectors (WHERE)
	 * @param fieldSelectors  List of column selectors (SELECT) or null to select all
	 * @param groupBySelectors Field selectors to group records (GROUP BY) or null for not grouping
	 * @param orderBySpecifiers Field selectors to order records (ORDER BY) or null for no order
	 * @param limit Limit on the number of records returned (LIMIT) or null if not used
	 * @param offset Start offset or returned records (OFFSET) or null if not used. Should be used only
	 *               with limit and orderBySpecifiers
	 * @return
	 * @throws Exception
	 */
	public JSONArray query(
			List<RecordSelector> recordSelectors
			,List<FieldSelector> fieldSelectors
			,List<FieldSelector> groupBySelectors
			,List<OrderSpecifier> orderBySpecifiers
			,Integer limit
			,Integer offset
			) throws Exception {
		
		OperationAccess operationAccess = tableSchema.getQueryAccess();
		if( false == operationAccess.isAllowed() ) {
			throw new Exception("Attempting to query a table while the privilege is not allowed: "+tableSchema.getLogicalName()+" ("+tableSchema.getPhysicalName()+")");
		}
		
		List<FieldSelector> effectiveFieldSelectors = new Vector<FieldSelector>();
		{
			// Create a list of queried fields
			if( null == fieldSelectors ) {
				// Select all available column for read
				for( ColumnData columnData : tableSchema.getColumns() ) {
					if( columnData.isReadable() ) {
						effectiveFieldSelectors.add(new FieldSelectorColumn(columnData.getColumnName()));
					}
				}
				
			} else {
				for(FieldSelector fieldSelector : fieldSelectors) {
					for( ColumnData columnData : fieldSelector.getColumnData(tableSchema) ) {
						if( null == columnData || false == columnData.isReadable() ) {
							throw new Exception(
									"Invalid selection on "+fieldSelector
									+" which is not available in table "+tableSchema.getLogicalName()
									+"("+tableSchema.getPhysicalName()+")"
									);
						}
					}
					effectiveFieldSelectors.add(fieldSelector);
				}
			}
			
			// Sort. This offers greater reusability of the prepared statement.
			Collections.sort(effectiveFieldSelectors, fieldSelectorComparator);
		}

		// groupBy fields
		List<FieldSelector> effectiveGroupBySelectors = new Vector<FieldSelector>();
		{
			if( null != groupBySelectors ) {
				for(FieldSelector fieldSelector : groupBySelectors) {
					for( ColumnData columnData : fieldSelector.getColumnData(tableSchema) ) {
						if( null == columnData || false == columnData.isReadable() ) {
							throw new Exception(
									"Invalid GROUP BY on "+fieldSelector
									+" which is not available in table "+tableSchema.getLogicalName()
									+"("+tableSchema.getPhysicalName()+")"
									);
						}
					}
					effectiveGroupBySelectors.add(fieldSelector);
				}
			}

			Collections.sort(effectiveGroupBySelectors,fieldSelectorComparator);
		}

		// ORDER BY specifiers
		List<OrderSpecifier> effectiveOrderBySelectors = new Vector<OrderSpecifier>();
		{
			if( null != orderBySpecifiers ) {
				for(OrderSpecifier orderSpecifier : orderBySpecifiers) {
					for( ColumnData columnData : orderSpecifier.getColumnData(tableSchema) ) {
						if( null == columnData || false == columnData.isReadable() ) {
							throw new Exception(
									"Invalid ORDER BY on "+orderSpecifier
									+" which is not available in table "+tableSchema.getLogicalName()
									+"("+tableSchema.getPhysicalName()+")"
									);
						}
					}
					effectiveOrderBySelectors.add(orderSpecifier);
				}
			}
		}

		// Figure out all WHERE clauses
		List<RecordSelector> effectiveRecordSelectors = computeEffectiveWhereClauses(recordSelectors, operationAccess);
		
		// Create SQL command
		PreparedStatement pstmt = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("SELECT ");
			{
				boolean first = true;
				for(FieldSelector fieldSelector : effectiveFieldSelectors) {
					if( first ) {
						first = false;
					} else {
						pw.print(",");
					}
					pw.print( fieldSelector.getQueryString(tableSchema, SqlElement.Phase.SELECT) );
				}
			}
			pw.print(" FROM ");
			pw.print(tableSchema.getPhysicalName());
			
			{
				boolean first = true;
				for( RecordSelector exp : effectiveRecordSelectors ) {
					if( first ) {
						pw.print(" WHERE ");
						first = false;
					} else {
						pw.print(" AND ");
					}
					pw.print( exp.getQueryString(tableSchema, SqlElement.Phase.WHERE) );
				}
			}
			
			if( effectiveGroupBySelectors.size() > 0 ) {
				boolean first = true;
				for( FieldSelector groupColumn : effectiveGroupBySelectors ) {
					if( first ) {
						pw.print(" GROUP BY ");
						first = false;
					} else {
						pw.print(",");
					}
					pw.print( groupColumn.getQueryString(tableSchema, SqlElement.Phase.GROUP_BY) );
				}
			}
			
			if( effectiveOrderBySelectors.size() > 0 ) {
				boolean first = true;
				for( OrderSpecifier orderSpecifier : effectiveOrderBySelectors ) {
					if( first ) {
						pw.print(" ORDER BY ");
						first = false;
					} else {
						pw.print(",");
					}
					pw.print( orderSpecifier.getQueryString(tableSchema, SqlElement.Phase.ORDER_BY) );
				}
			}
			
			if( null != limit ) {
				int limitInt = limit.intValue();
				pw.print(" LIMIT ");
				pw.print(limitInt);
				
				if( null != offset ) {
					int offsetInt = offset.intValue();
					pw.print(" OFFSET ");
					pw.print(offsetInt);
				}
			}
			
			pw.flush();			
			
			String sqlQuery = sw.toString();
			pstmt = connection.prepareStatement(sqlQuery);
//logger.info("SQL Query: "+sqlQuery);			
			
			// Populate prepared statement
			int index = 1;
			for( FieldSelector fs : effectiveFieldSelectors ) {
				for(TypedValue value : fs.getQueryValues(tableSchema, variables)) {
//logger.info("Value "+value.getValue()+" ("+value.getColumnDataType()+")");
					ColumnDataUtils.writeToPreparedStatement(pstmt, index, value);
					++index;					
				}
			}
			for( RecordSelector exp : effectiveRecordSelectors ) {
				for(TypedValue value : exp.getQueryValues(tableSchema, variables)) {
//logger.info("Value "+value.getValue()+" ("+value.getColumnDataType()+")");
					ColumnDataUtils.writeToPreparedStatement(pstmt, index, value);
					++index;					
				}
			}
			for( FieldSelector groupBySelector : effectiveGroupBySelectors ) {
				for(TypedValue value : groupBySelector.getQueryValues(tableSchema, variables)) {
//logger.info("Value "+value.getValue()+" ("+value.getColumnDataType()+")");
					ColumnDataUtils.writeToPreparedStatement(pstmt, index, value);
					++index;					
				}
			}
			for( OrderSpecifier orderSpecifier : effectiveOrderBySelectors ) {
				for(TypedValue value : orderSpecifier.getQueryValues(tableSchema, variables)) {
//logger.info("Value "+value.getValue()+" ("+value.getColumnDataType()+")");
					ColumnDataUtils.writeToPreparedStatement(pstmt, index, value);
					++index;					
				}
			}
		}
		
		// Now, we need to retrieve the objects
		JSONArray array = ColumnDataUtils.executeStatementToJson(pstmt);
		
		return array;
	}

	/**
	 * Updates a set of records (rows) in a table based on the selectors and
	 * new values. This method respect the table schema and the user's capabilities
	 * while performing the operation.
	 * @param whereClauses Listof WhereExpression instances to select proper records
	 * @param params Map of column names to values used to modify the records.
	 * @return An array of JSON objects, representing the updated objects.
	 * @throws Exception
	 */
	public JSONArray update(List<RecordSelector> whereClauses, Map<String, String> params) throws Exception {
		OperationAccess operationAccess = tableSchema.getUpdateAccess();
		if( false == operationAccess.isAllowed() ) {
			throw new Exception("Attempting to update a table while the privilege is not allowed: "+tableSchema.getLogicalName()+" ("+tableSchema.getPhysicalName()+")");
		}
		
		// Figure out all WHERE clauses
		List<RecordSelector> effectiveWhereClauses = computeEffectiveWhereClauses(whereClauses, operationAccess);

		// Create a list of all writable columns where a value is specified in
		// the parameters
		List<ColumnData> columnsWithParam = new Vector<ColumnData>();
		for(String columnName : params.keySet()) {
			ColumnData columnData = tableSchema.getColumnFromName(columnName);
			
			if( null != columnData && false == columnData.isWriteable() ) {
				columnData = null;
			}
			if( null != columnData && columnData.isAutoIncrementInteger() ) {
				columnData = null;
			}
			
			if( null == columnData ) {
				throw new Exception("No write access to column "+columnName+" in table "+tableSchema.getLogicalName()+" ("+tableSchema.getPhysicalName()+")");
			} else {
				columnsWithParam.add(columnData);
			}
		}
		
		// Sort according to column name. This offers greater reusability
		// of the prepared statement.
		Collections.sort(columnsWithParam,new Comparator<ColumnData>(){
			public int compare(ColumnData left, ColumnData right) {
				return left.getColumnName().compareTo( right.getColumnName() );
			}
		});
		
		// No point in running an update if there is nothing to set
		if( columnsWithParam.size() < 1 ) {
			throw new Exception("Attempting to update without providing any values to set");
		}
		
		// Create SQL command
		String sqlQuery = null;
		PreparedStatement pstmt = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("UPDATE ");
			pw.print(tableSchema.getPhysicalName());
			pw.print(" SET ");
			{
				boolean first = true;
				for(ColumnData columnData : columnsWithParam) {
					if( first ) {
						first = false;
					} else {
						pw.print(",");
					}
					pw.print(columnData.getColumnName());
					pw.print(" = ");
					pw.print(columnData.getInsertWildcard());
				}
			}
			{
				boolean first = true;
				for( RecordSelector exp : effectiveWhereClauses ) {
					if( first ) {
						pw.print(" WHERE ");
						first = false;
					} else {
						pw.print(" AND ");
					}
					pw.print( exp.getQueryString(tableSchema, SqlElement.Phase.WHERE) );
				}
			}
			pw.flush();
			
			sqlQuery = sw.toString();
			pstmt = connection.prepareStatement(sqlQuery);
			
			// Populate prepared statement
			int index = 1;
			for(ColumnData columnData : columnsWithParam) {
				// Compute value
				String value = params.get(columnData.getColumnName());
				
				ColumnDataUtils.writeToPreparedStatement(pstmt, index, value, columnData.getColumnType());
				
				++index;
			}
			for( RecordSelector exp : effectiveWhereClauses ) {
				for(TypedValue value : exp.getQueryValues(tableSchema, variables)) {
					ColumnDataUtils.writeToPreparedStatement(pstmt, index, value);
					++index;					
				}
			}
		}
		
		// Execute insert
		pstmt.execute();

		// Now, we need to retrieve the objects
		JSONArray array = query(whereClauses, null, null,null,null,null);
		
		return array;
	}

	/**
	 * Deletes a set of records (rows) in the table according to the given
	 * selectors. This method respect the table schema and the user's capabilities while
	 * performing the operation.
	 * @param whereClauses List of WhereExpression instances to select proper records
	 * @throws Exception
	 */
	public void delete(List<RecordSelector> whereClauses) throws Exception {
		OperationAccess operationAccess = tableSchema.getDeleteAccess();
		if( false == operationAccess.isAllowed() ) {
			throw new Exception("Attempting to delete record(s) from a table while the privilege is not allowed: "+tableSchema.getLogicalName()+" ("+tableSchema.getPhysicalName()+")");
		}
		
		// Figure out all WHERE clauses
		List<RecordSelector> effectiveWhereClauses = computeEffectiveWhereClauses(whereClauses, operationAccess);

		// Create SQL command
		String sqlQuery = null;
		PreparedStatement pstmt = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("DELETE FROM ");
			pw.print(tableSchema.getPhysicalName());
			{
				boolean first = true;
				for( RecordSelector exp : effectiveWhereClauses ) {
					if( first ) {
						pw.print(" WHERE ");
						first = false;
					} else {
						pw.print(" AND ");
					}
					pw.print( exp.getQueryString(tableSchema, SqlElement.Phase.WHERE) );
				}
			}
			pw.flush();
			
			sqlQuery = sw.toString();
			pstmt = connection.prepareStatement(sqlQuery);
			
			// Populate prepared statement
			int index = 1;
			for( RecordSelector exp : effectiveWhereClauses ) {
				for(TypedValue value : exp.getQueryValues(tableSchema, variables)) {
					ColumnDataUtils.writeToPreparedStatement(pstmt, index, value);
					++index;					
				}
			}
		}
		
		// Execute insert
		pstmt.execute();
	}
	
	private List<RecordSelector> computeEffectiveWhereClauses(
			List<RecordSelector> whereClausesFromCaller
			,OperationAccess operationAccess
			) throws Exception {
		List<RecordSelector> effectiveWhereClauses = new Vector<RecordSelector>();

		// Add WHERE clauses from caller
		if( null != whereClausesFromCaller ) {
			for( RecordSelector whereClause : whereClausesFromCaller ) {
				List<ColumnData> columnDataList = whereClause.getColumnData(tableSchema);
				for(ColumnData columnData : columnDataList) {
					// Check that we can read that column
					if( null == columnData || false == columnData.isReadable() ) {
						throw new Exception(
							"Where Clause column "+whereClause
							+" is not available in table "+tableSchema.getLogicalName()
							+"("+tableSchema.getPhysicalName()+")"
							);
					}
				}
				
				effectiveWhereClauses.add( whereClause );
			}
		}
		
		// Add row selectors from operation
		effectiveWhereClauses.addAll( operationAccess.getWhereClauses() );
		
		// Add row selectors from schema
		for( ColumnData columnData : tableSchema.getColumns() ) {
			List<RecordSelector> rowSelectors = columnData.getRowSelectors(); 
			if( null != rowSelectors && rowSelectors.size() > 0 ) {
				for(RecordSelector rowSelector : rowSelectors) {
					effectiveWhereClauses.add( rowSelector );
				}
			}
		}

		// Sort to help reusability of the prepared statements.
		Collections.sort(effectiveWhereClauses,new RecordSelectorComparator());

		return effectiveWhereClauses;
	}
}
