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
package ca.carleton.gcrc.dbSec.impl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Time;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import javax.servlet.ServletException;

import org.json.JSONArray;
import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.dbSec.ColumnData;

public class ColumnDataUtils {
	static final protected Logger logger = LoggerFactory.getLogger("ca.carleton.gcrc.dbSec.impl.ColumnDataUtils");

	static private SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");
	static private SimpleDateFormat tsFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	static private SimpleDateFormat timeFormatter = new SimpleDateFormat("HH:mm:ss");
	
	static public ColumnData.Type columnDataTypeFromSQLType(int sqlType, String columnName, String sqlTypeName) throws Exception {
		// Figure out internal type
		ColumnData.Type colType = ColumnData.Type.UNKNOWN;
		switch (sqlType) {
			case java.sql.Types.NUMERIC:
			case java.sql.Types.DOUBLE:	
			case java.sql.Types.FLOAT:
				colType = ColumnData.Type.DOUBLE;
				break;
				
			case java.sql.Types.INTEGER:
			case java.sql.Types.SMALLINT:
				colType = ColumnData.Type.INTEGER;
				break;
			
			case java.sql.Types.BIGINT:
				colType = ColumnData.Type.BIGINT;
				break;

			case java.sql.Types.VARCHAR:
			case java.sql.Types.CHAR:
				colType = ColumnData.Type.STRING;
				break;
				
			case java.sql.Types.DATE:
				colType = ColumnData.Type.DATE;
				break;
				
			case java.sql.Types.TIME:
				colType = ColumnData.Type.TIME;
				break;
			
			case java.sql.Types.TIMESTAMP:
				colType = ColumnData.Type.TIMESTAMP;
				break;
				
			case java.sql.Types.BOOLEAN:
				colType = ColumnData.Type.BOOLEAN;
				break;
			
			default:
				if( "geometry".equals(sqlTypeName) ) {
					colType = ColumnData.Type.GEOMETRY;
					
				} else if( "bool".equals(sqlTypeName) ) {
					colType = ColumnData.Type.BOOLEAN;
					
				} else {
					throw new Exception("Unable to figure out column type for "+columnName+" - type:"+sqlType+"("+sqlTypeName+")");
				}
		}
		
		return(colType);
	}

	static public void addRequiredParmToPreparedStatement(
			PreparedStatement ps,
			String key,
			int index,
			List<String> values,
			ColumnData columnData) throws Exception {
		if (null == values) {
			throw new Exception("Parameter "+key+" not provided");
		}
		if (values.size() < 1) {
			throw new Exception("Parameter "+key+" not provided");
		}
		if (values.size() > 1) {
			throw new Exception("Parameter "+key+" provided multiple times");
		}
		writeToPreparedStatement(ps, index, values.get(0), columnData.getColumnType());
	}
	
	static public void addOptionalParmToPreparedStatement(
			PreparedStatement ps,
			String key,
			int index,
			List<String> values,
			ColumnData columnData) throws Exception {
		String val = null;
		if (null != values) {
			if (values.size() == 1) {
				val = values.get(0);
				if ("null".equalsIgnoreCase(val)) {
					val = null;
				}
			} else if (values.size() > 1) {
				String w = "";
				for (String v : values) {
					w += v + " ";
				}
				logger.info("values for "+key+":"+w);
				throw new Exception("Parameter "+key+" provided multiple times");
			}
		}
		writeToPreparedStatement(ps, index, val, columnData.getColumnType());
	}

	static public void writeToPreparedStatement(PreparedStatement pstmt, int index, TypedValue typedValue) throws Exception {
		writeToPreparedStatement(pstmt, index, typedValue.getValue(), typedValue.getColumnDataType());
	}

	static public void writeToPreparedStatement(PreparedStatement pstmt, int index, String value, ColumnData.Type columnDataType) throws Exception {
		if( ColumnData.Type.STRING == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.VARCHAR);
			} else {
				pstmt.setString(index, value);
			}
			
		} else if( ColumnData.Type.INTEGER == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.INTEGER);
			} else {
				int intValue = Integer.parseInt(value);
				pstmt.setInt(index, intValue);
			}
			
		} else if( ColumnData.Type.BIGINT == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.BIGINT);
			} else {
				long longValue = Long.parseLong(value);
				pstmt.setLong(index, longValue);
			}
			
		} else if( ColumnData.Type.DOUBLE == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.DOUBLE);
			} else {
				double doubleValue = Double.parseDouble(value);
				pstmt.setDouble(index, doubleValue);
			}
			
		} else if( ColumnData.Type.TIME == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.TIME);
			} else {
				Date dateValue = timeFormatter.parse(value);
				pstmt.setTime(index, new java.sql.Time(dateValue.getTime()));
			}
			
		} else if( ColumnData.Type.DATE == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.DATE);
			} else {
				Date dateValue = dateFormatter.parse(value);
				pstmt.setDate(index, new java.sql.Date(dateValue.getTime()));
			}
			
		} else if( ColumnData.Type.TIMESTAMP == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.TIMESTAMP);
			} else {
				Date dateValue = tsFormatter.parse(value);
				pstmt.setTimestamp(index, new java.sql.Timestamp(dateValue.getTime()));
			}
			
		} else if( ColumnData.Type.GEOMETRY == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.VARCHAR);
			} else {
				pstmt.setString(index, value);
			}
			
		} else if( ColumnData.Type.BOOLEAN == columnDataType ) {
			if( null == value || 0 == value.length() ) {
				pstmt.setNull(index,java.sql.Types.BOOLEAN);
			} else {
				boolean f = Boolean.parseBoolean(value);
				pstmt.setBoolean(index, f);
			}
			
		} else {
			throw new Exception("Uknown method to convert type "+columnDataType.toString());
		}
	}
	
	static public void addColumnToJson(
			JSONObject obj
			,ResultSet rs
			,int index
			,String columnName
			,int columnSqlType
			,String columnSqlTypeName
			) throws Exception {
		if( java.sql.Types.INTEGER == columnSqlType ) {
			obj.put(columnName,rs.getInt(index));

		} else if( java.sql.Types.BIGINT == columnSqlType ) {
			obj.put(columnName,rs.getLong(index));

		} else if( java.sql.Types.VARCHAR == columnSqlType ) {
			obj.put(columnName,rs.getString(index));

		} else if( java.sql.Types.TIME == columnSqlType ) {
			Time time = rs.getTime(index);
			if( null != time ) {
				String timeString = timeFormatter.format(time);
				long timeMs = time.getTime();
				JSONObject timeObj = new JSONObject();
				timeObj.put("formatted", timeString);
				timeObj.put("raw", timeMs);
				obj.put(columnName,timeObj);
			}

		} else if( java.sql.Types.DATE == columnSqlType ) {
			java.sql.Date date = rs.getDate(index);
			if( null != date ) {
				String dateString = dateFormatter.format(date);
				long timeMs = date.getTime();
				JSONObject timeObj = new JSONObject();
				timeObj.put("formatted", dateString);
				timeObj.put("raw", timeMs);
				obj.put(columnName,timeObj);
			}

		} else if( java.sql.Types.TIMESTAMP == columnSqlType ) {
			java.sql.Timestamp ts = rs.getTimestamp(index);
			if( null != ts ) {
				String tsString = tsFormatter.format(ts);
				long timeMs = ts.getTime();
				JSONObject timeObj = new JSONObject();
				timeObj.put("formatted", tsString);
				timeObj.put("raw", timeMs);
				obj.put(columnName,timeObj);
			}

		} else if( java.sql.Types.BOOLEAN == columnSqlType ) {
			obj.put(columnName,rs.getBoolean(index));

		} else if( java.sql.Types.VARCHAR == columnSqlType ) {
			obj.put(columnName,rs.getString(index));

		} else if( java.sql.Types.NUMERIC == columnSqlType ) {
			obj.put(columnName,rs.getBigDecimal(index));

		} else if( java.sql.Types.DOUBLE == columnSqlType ) {
			obj.put(columnName,rs.getDouble(index));

		} else if( java.sql.Types.FLOAT == columnSqlType ) {
			obj.put(columnName,rs.getFloat(index));

		} else if( "bool".equals(columnSqlTypeName) ) {
			obj.put(columnName,rs.getBoolean(index));

		} else {
			throw new Exception("Unknown selected column type - name:"+columnName
					+" type:"+columnSqlType+"("+columnSqlTypeName+")");
		}
	}

	static public JSONArray executeStatementToJson(PreparedStatement pstmt) throws Exception {
		boolean resultAvailable = pstmt.execute();
		if (!resultAvailable) { // There's a ResultSet to be had
			// indicates an update count or no results - this must be no results
			throw new Exception("Query returned no results");
		}
		ResultSet rs = pstmt.getResultSet();
		ResultSetMetaData rsmd = rs.getMetaData();

		JSONArray array = new JSONArray();
		try {
			while (rs.next()) {

				JSONObject obj = new JSONObject();
				for(int loop=0; loop<rsmd.getColumnCount(); ++loop) {
					int index = loop+1;						
					addColumnToJson(
							obj
							,rs
							,index
							,rsmd.getColumnName(index)
							,rsmd.getColumnType(index)
							,rsmd.getColumnTypeName(index)
							);
				}
				array.put(obj);

			}
		} catch (Exception je) {
			throw new ServletException("Error while parsing results",je);
		}

		return(array);
	}

	/**
	 * Performs a database query to find the next integer in the sequence reserved for
	 * the given column.
	 * @param autoIncrementIntegerColumn Column data where a new integer is required 
	 * @return The next integer in sequence
	 * @throws Exception
	 */
	static public int obtainNextIncrementInteger(Connection connection, ColumnData autoIncrementIntegerColumn) throws Exception {
		try {
			String sqlQuery = "SELECT nextval(?);";

			// Create SQL command
			PreparedStatement pstmt = null;
			{
				pstmt = connection.prepareStatement(sqlQuery);
				
				// Populate prepared statement
				pstmt.setString(1, autoIncrementIntegerColumn.getAutoIncrementSequence());
			}

			if( pstmt.execute() ) {
				ResultSet rs = pstmt.getResultSet();
				if( rs.next() ) {
					int nextValue = rs.getInt(1);
					
					return nextValue;
				} else {
					throw new Exception("Empty result returned by SQL: "+sqlQuery);
				}
				
			} else {
				throw new Exception("No result returned by SQL: "+sqlQuery);
			}
		} catch( Exception e ) {
			throw new Exception("Error while attempting to get a auto increment integer value for: "+
					autoIncrementIntegerColumn.getColumnName()+
					" ("+autoIncrementIntegerColumn.getAutoIncrementSequence()+")",e);
		}
	}
}
