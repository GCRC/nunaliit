/*
Copyright (c) 2009, Geomatics and Cartographic Research Centre, Carleton 
University All rights reserved.

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


import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ca.carleton.gcrc.jdbc.JdbcConnections;
import ca.carleton.gcrc.jdbc.JdbcUtils;

public class JdbcDataAsJSONArray extends HttpServlet {

	private static final long serialVersionUID = 1L;
	
	private static Pattern stringParamPattern = Pattern.compile("\\s*string\\((.+)\\)\\s*");

	private JdbcConnections connections;

	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		connections = JdbcConnections.connectionsFromServletContext(config.getServletContext());
	}
	
	private Where parseWhereParm(String value) throws Exception {
		String whereTokens[] = value.split(",");
		if (3 != whereTokens.length) {
			throw new Exception("Where parameter not including 3 tokens: "+value);
		}

		Where where = null;
		
		Matcher stringParamMatcher = stringParamPattern.matcher(whereTokens[2]);
		if( stringParamMatcher.matches() ) {
			where = new Where(whereTokens[0],whereTokens[1],stringParamMatcher.group(1));
		} else {
			// Then, it is an integer
			int intValue = Integer.parseInt(whereTokens[2]);
			where = new Where(whereTokens[0],whereTokens[1],intValue);
		}
		
		return(where);
	}
	
	private String GenerateWhereClause(List<Where> whereParms) throws Exception {
		boolean firstSelect = true;
		String retVal = "";
		Iterator<Where> itWhere = whereParms.iterator();
		while( itWhere.hasNext() ) {
			Where where = itWhere.next();
			if( firstSelect ) {
				firstSelect = false;
				retVal += " WHERE ";
			} else {
				retVal += " AND ";
			}
			retVal += (JdbcUtils.safeSqlQueryIdentifier(where.getLeft()) + " " + where.getOp().getSqlQuery() + " ");
			if( null != where.getStringValue() ) {
				retVal += (JdbcUtils.safeSqlQueryStringValue(where.getStringValue()));
			} else {
				retVal += ""+where.getIntValue();
			}
		}
		return(retVal);
	}
	
	private String createSqlQueryForPointGeometryRetrieval(HttpServletRequest req) throws Exception {
		/*
		 * Creates a SQL query string capable of selecting the point geometry from a table.
		 * 
		 * geom=<geom_column>&xname=<name_for_x>&yname=<name_for_y>&from=<table>
		 * 		[&where=<where_descriptor>[&...]]]
		 * 		[&include_fields=<include_fields>]
		 * 
		 * where:
		 * 
		 * <geom_column> is the name of the geometry column in <table>.
		 * <name_for_x> is the name to assign for the x value.
		 * <name_for_y> is the name to assign for the y value.
		 * <include_fields> is an optional list of fields to be included in the results (but not searched).
		 * <where_descriptor> is:
		 *   <field>/<comparator>/<value>
		 *   
		 *   and:
		 *   
		 *   <field> is a valid field name for the identified table.
		 *   <comparator> is "eq", "ge", "gt", "le", "lt", "is", "isnot"
		 *   <value> is an integer value by default but could be string if in the 
		 *           form 'string(abc)' in which case it is converted to 'abc'.
		 */
		List<String> includes = new Vector<String>();
		String geomParm = null;
		String tableParm = null;
		String xnameParm = null;
		String ynameParm = null;
		List<Where> whereParms = new Vector<Where>();

		Enumeration<?> paramEnum = req.getParameterNames();
		while (paramEnum.hasMoreElements()) {
			String key = (String)paramEnum.nextElement();
			String[] values = req.getParameterValues(key);

			for (int valueIndex=0; valueIndex<values.length; ++valueIndex) {
				String value = values[valueIndex].trim();
				
				if (value.length() > 0) {
					if ("geom".equalsIgnoreCase(key)) {
						if (null != geomParm) {
							throw new Exception("'geom_column' field specified multiple times");
						}
						geomParm = value;
					} else if ("from".equalsIgnoreCase(key)) {
						if (null != tableParm) {
							throw new Exception("'from' field specified multiple times");
						}
						tableParm = value;
					} else if ("include_fields".equalsIgnoreCase(key)) {
						String[] includeFieldParms = value.split(",");
						for (int loop=0; loop<includeFieldParms.length; ++loop) {
							includes.add(includeFieldParms[loop]);
						}
					} else if ("xname".equalsIgnoreCase(key)) {
						if (null != xnameParm) {
							throw new Exception("'xname' field specified multiple times");
						}
						xnameParm = value;
					} else if ("yname".equalsIgnoreCase(key)) {
						if (null != ynameParm) {
							throw new Exception("'yname' field specified multiple times");
						}
						ynameParm = value;
					} else if( "where".equalsIgnoreCase(key) ) {
						Where where = parseWhereParm(value);
						whereParms.add(where);
					} else if( "db".equalsIgnoreCase(key) ) {
						// accept but ignore - dealt with separately
					} else {
						throw new Exception("unexpected parm: "+key); // reject immediately - see doGet
					}
				}		
			}
		}
		
		if (null == tableParm || null == geomParm || null == xnameParm || null == ynameParm) {
			throw new Exception("'geom', 'xname', 'yname', and 'from' fields must be specified");
		}
		
		String sqlQuery = "SELECT ";		
		if (0 < includes.size()) {
			Iterator<String> includesIter = includes.iterator();
			while (includesIter.hasNext()) {
				// we know there are search_fields to be added after so always add "'"
				String includeString = includesIter.next();
				sqlQuery += JdbcUtils.safeSqlQueryIdentifier(includeString) + ",";
			}
		}
		
		sqlQuery += "ST_X(ST_GeometryN(" + JdbcUtils.safeSqlQueryIdentifier(geomParm) +
			",1)) as " + JdbcUtils.safeSqlQueryIdentifier(xnameParm) + ",";
		sqlQuery += "ST_Y(ST_GeometryN(" + JdbcUtils.safeSqlQueryIdentifier(geomParm) +
			",1)) as " + JdbcUtils.safeSqlQueryIdentifier(ynameParm) + " ";
		sqlQuery += "FROM " + JdbcUtils.safeSqlQueryIdentifier(tableParm) + " ";

		// deal with where clause...
		sqlQuery += GenerateWhereClause(whereParms);
		sqlQuery += ";";

		return(sqlQuery);
	}
	
	private String createSqlQueryForSearchFieldRequest(HttpServletRequest req) throws Exception {
		/*
		 * Creates a SQL query string capable of searching a set of fields in
		 * a table for partial matches on an input string.
		 * 
		 * search_fields=<search_fields>&from=<table>&for=<match-text>[&include_fields=<include_fields>]
		 * 		[&score_column=<score_name>]
		 * 
		 * where:
		 * 
		 * <search_fields> is a comma-separated list of fields in <table>.
		 * <match_text> is the (simple) text pattern to match in the fields.
		 * <include_fields> is an optional list of fields to be included in the results (but not searched).
		 * <score_name> if defined, indicates that the scores column should be included in the output and
		 * 		assigns that column a name.
		 */
		List<String> fields = new Vector<String>();
		List<String> includes = new Vector<String>();
		String matchText = null;
		String tableParm = null;
		String scoreParm = null;
		String contributor = null;

		Enumeration<?> paramEnum = req.getParameterNames();
		while (paramEnum.hasMoreElements()) {
			String key = (String)paramEnum.nextElement();
			String[] values = req.getParameterValues(key);

			for (int valueIndex=0; valueIndex<values.length; ++valueIndex) {
				String value = values[valueIndex].trim();
				
				if (value.length() > 0) {
					if ("search_fields".equalsIgnoreCase(key)) {
						String[] searchFieldParms = value.split(",");
						for (int loop=0; loop<searchFieldParms.length; ++loop) {
							fields.add(searchFieldParms[loop]);
						}
					} else if ("include_fields".equalsIgnoreCase(key)) {
						String[] includeFieldParms = value.split(",");
						for (int loop=0; loop<includeFieldParms.length; ++loop) {
							includes.add(includeFieldParms[loop]);
						}
					} else if ("from".equalsIgnoreCase(key)) {
						if (null != tableParm) {
							throw new Exception("'from' field specified multiple times");
						}
						tableParm = value;
					} else if ("contributor".equalsIgnoreCase(key)) {
						if (null != contributor) {
							throw new Exception("'contributor' field specified multiple times");
						}
						contributor = value;
					} else if ("score_column".equalsIgnoreCase(key)) {
						if (null != scoreParm) {
							throw new Exception("'score_column' field specified multiple times");
						}
						scoreParm = value;
					} else if ("for".equalsIgnoreCase(key)) {
						if (null != matchText) {
							throw new Exception("'for' field specified multiple times");
						}
						matchText = value;
					} else if( "db".equalsIgnoreCase(key) ) {
						// accept but ignore - dealt with separately
					} else {
						throw new Exception("unexpected parm: "+key); // reject immediately - see doGet
					}
				}		
			}
		}
		
		if (0 == fields.size() || null == tableParm || null == matchText) {
			throw new Exception("'search_field', 'from', and 'for' fields must be specified");
		}
		
		String sqlQuery = "SELECT ";
		String whereClause = " WHERE ";
		String orderByClause = "";
		String orderByClosing = "";
		
		if( null != contributor ) {
			sqlQuery += "contributor_id,";
		}
		
		if (0 < includes.size()) {
			Iterator<String> includesIter = includes.iterator();
			while (includesIter.hasNext()) {
				// we know there are search_fields to be added after so always add "'"
				String includeString = includesIter.next();
				sqlQuery += JdbcUtils.safeSqlQueryIdentifier(includeString) + ",";
			}
		}

		int count = 0;
		Iterator<String> fieldsIter = fields.iterator();
		while (fieldsIter.hasNext()) {
			String fieldString = fieldsIter.next();
			if (0 < count) {
				sqlQuery += ",";
				whereClause += "OR ";
				orderByClause += ",";
			}
			sqlQuery += JdbcUtils.safeSqlQueryIdentifier(fieldString);
			whereClause += "lower(" + JdbcUtils.safeSqlQueryIdentifier(fieldString) + ") LIKE lower(" +
				JdbcUtils.safeSqlQueryStringValue("%" + matchText + "%") + ") ";
			if (1 == fields.size()) {
				// simple case - all records match the only field being checked...
				orderByClause += "position(lower(" +
					JdbcUtils.safeSqlQueryStringValue(matchText) + ") IN lower(" +
					JdbcUtils.safeSqlQueryIdentifier(fieldString) + "))";
			} else {
				if (count < (fields.size() - 1)) {
					orderByClause += "least(coalesce(nullif(position(lower(" +
						JdbcUtils.safeSqlQueryStringValue(matchText) + ") IN lower(" +
						JdbcUtils.safeSqlQueryIdentifier(fieldString) + ")), 0), 9999)";
					orderByClosing += ")";
				} else {
					orderByClause += "coalesce(nullif(position(lower(" +
						JdbcUtils.safeSqlQueryStringValue(matchText) + ") IN lower(" +
						JdbcUtils.safeSqlQueryIdentifier(fieldString) + ")), 0), 9999)";
				}
			}
			count++;
		}
		
		if (null != scoreParm) {
			sqlQuery += "," + orderByClause + orderByClosing + " AS " +
				JdbcUtils.safeSqlQueryIdentifier(scoreParm);
		}
		
		sqlQuery += " FROM " + JdbcUtils.safeSqlQueryIdentifier(tableParm) +
			whereClause + "ORDER BY " + orderByClause + orderByClosing + ";";

		return(sqlQuery);
	}
	
	private String createSqlQueryString(HttpServletRequest req) throws Exception {
		/*
		 * Creates a SQL query string capable of subsetting a single table.
		 * 
		 * query string format:
		 * 
		 * select=<select_fields>&from=<table>[&where=<where_descriptor>[&where=<where_descriptor>[&...]]][&group=<group_fields>]
		 * 
		 * where:
		 * 
		 * <select_fields> is a comma-separated list of fields in <table>.
		 * <group_fields> is a comma-separated list of fields in <table>.
		 * <table> is a valid table identifier in the database.
		 * <where_descriptor> is:
		 *   <field>/<comparator>/<value>
		 *   
		 *   and:
		 *   
		 *   <field> is a valid field name for the identified table.
		 *   <comparator> is "eq", "ge", "gt", "le", "lt", "is", "isnot"
		 *   <value> is an integer value by default but could be string if in the 
		 *           form 'string(abc)' in which case it is converted to 'abc'.
		 */
		List<String> select = new Vector<String>();
		String tableParm = null;
		List<Where> whereParms = new Vector<Where>();
		List<String> groupParms = new Vector<String>();
		
		Enumeration<?> paramEnum = req.getParameterNames();
		while( paramEnum.hasMoreElements() ) {
			String key = (String)paramEnum.nextElement();
			String[] values = req.getParameterValues(key);

			for(int valueIndex=0; valueIndex<values.length; ++valueIndex) {
				String value = values[valueIndex].trim();
				
				if( value.length() > 0 ) {
					if( "select".equalsIgnoreCase(key) ) {
						String[] selectParms = value.split(",");
						for(int loop=0; loop<selectParms.length; ++loop) {
							select.add(selectParms[loop]);
						}
						
					} else if( "from".equalsIgnoreCase(key) ) {
						if( null != tableParm ) {
							throw new Exception("'from' field specified multiple times");
						}
						tableParm = value;
						
					} else if( "group".equalsIgnoreCase(key) ) {
						String[] selectParms = value.split(",");
						for(int loop=0; loop<selectParms.length; ++loop) {
							groupParms.add(selectParms[loop]);
						}
						
					} else if( "where".equalsIgnoreCase(key) ) {
						Where where = parseWhereParm(value);
						whereParms.add(where);
					} else if( "db".equalsIgnoreCase(key) ) {
						// accept but ignore - dealt with separately
					} else {
						throw new Exception("unexpected parm: "+key); // reject immediately - see doGet
					}
				}
			}
		}
		
		if( 0 == select.size() || null == tableParm ) {
			throw new Exception("'select' and 'from' fields must be specified");
		}
		
		// Build query string...
		String sqlQuery = "SELECT ";
		
		// ...select
		{
			boolean firstSelect = true;
			Iterator<String> itSelectString = select.iterator();
			while( itSelectString.hasNext() ) {
				String selectString = itSelectString.next();
				if( firstSelect ) {
					firstSelect = false;
				} else {
					sqlQuery += ",";
				}
				sqlQuery += JdbcUtils.safeSqlQueryIdentifier(selectString);
			}
		}

		// ...from
		sqlQuery += " FROM " + JdbcUtils.safeSqlQueryIdentifier(tableParm);
		
		// ...where
		{
			sqlQuery += GenerateWhereClause(whereParms);
		}
		
		// ...group by
		{
			boolean firstSelect = true;
			Iterator<String> itGroup = groupParms.iterator();
			while( itGroup.hasNext() ) {
				String group = itGroup.next();
				if( firstSelect ) {
					firstSelect = false;
					sqlQuery += " GROUP BY ";
				} else {
					sqlQuery += ",";
				}
				sqlQuery += JdbcUtils.safeSqlQueryIdentifier(group);
			}
		}

		sqlQuery += ";";
		
		return sqlQuery;
	}
	
	public void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
		String httpQuery = req.getQueryString();
		if (null == httpQuery) {
			// no query string - what have I been asked for?
			throw new ServletException("No query parameters provided.");
		}

		// Get database connection
		Connection con = null;
		{
			String[] dbs = req.getParameterValues("db");
			if( dbs.length < 1 ) {
				throw new ServletException("Database (db) not specified in query - http query: "+httpQuery);
			}
			if( dbs.length > 1 ) {
				throw new ServletException("Database (db) specified multiple times in query - http query: "+httpQuery);
			}
			try {
				con = connections.getDb(dbs[0]);
			} catch (Exception e) {
				throw new ServletException("Error while connecting to database ("+dbs[0]+")",e);
			}
			if (null == con) {
				throw new ServletException("Database ("+dbs[0]+") not available");
			}
		}
		
		String sqlQuery = null;
		try {
			if( null != req.getParameterValues("search_fields") ) {
				sqlQuery = createSqlQueryForSearchFieldRequest(req);
				
			} else if( null != req.getParameterValues("geom") ) {
				sqlQuery = createSqlQueryForPointGeometryRetrieval(req);
				
			} else {
				sqlQuery = createSqlQueryString(req);
			}
		} catch (Exception e) {
			throw new ServletException("Syntax error in SQL query parameters - http query: "+httpQuery, e);									
		}

		try {
			Statement stmt = con.createStatement();

			if (stmt.execute(sqlQuery)) {
				// There's a ResultSet to be had
				ResultSet rs = stmt.getResultSet();
				ResultSetMetaData rsmd = rs.getMetaData();

				int numColumns = rsmd.getColumnCount();
				String columnNames[] = new String[numColumns+1];
				int columnTypes[] = new int[numColumns+1];
				for (int i=1; i <= numColumns; i++) {
					columnNames[i] = rsmd.getColumnName(i);
					columnTypes[i] = rsmd.getColumnType(i);
				}

				JSONArray array = new JSONArray();
				try {
					Map<Integer,JSONObject> contributorMap = new HashMap<Integer,JSONObject>();
					while (rs.next()) {
						JSONObject obj = new JSONObject();
						array.put(obj);
						
						int contributor_id = 0;
						for (int i=1; i <= numColumns; i++) {
							
							switch (columnTypes[i]) {
								case java.sql.Types.NUMERIC:
								case java.sql.Types.DOUBLE:	
								case java.sql.Types.FLOAT:
									obj.put(columnNames[i],rs.getDouble(i));
									break;
									
								case java.sql.Types.INTEGER:
								case java.sql.Types.SMALLINT:
									obj.put(columnNames[i],rs.getInt(i));
									if( "contributor_id".equals(columnNames[i]) ) {
										contributor_id = rs.getInt(i);
									}
									break;

								case java.sql.Types.VARCHAR:
								case java.sql.Types.CHAR:
									obj.put(columnNames[i],rs.getString(i));
									break;
								
								default:
									throw new ServletException("Unknown column type ("+i+") - query: "+sqlQuery);
							}
						}

						// Convert contributor id into user info
						Integer contId = contributor_id;
						JSONObject userInfo = null;
						if( contributorMap.containsKey(contId) ) {
							userInfo = contributorMap.get(contId);
						} else {
							try {
								PreparedStatement pstmt = con.prepareStatement("SELECT name,group_id FROM users WHERE id=?;");
								pstmt.setInt(1, contributor_id);
								if( pstmt.execute() ) {
									ResultSet prs = pstmt.getResultSet();
									if( prs.next() ) {
										userInfo = new JSONObject();
										userInfo.put("display", prs.getString(1));
										userInfo.put("anonymous", (prs.getInt(2)==0));
									}
								}
							} catch(Exception e) {
								// Just ignore
							}
							// cache
							contributorMap.put(contId, userInfo);
						}
						if( null != userInfo ) {
							obj.put("contributor", userInfo);
						}
					}
				} catch (Exception je) {
					throw new ServletException("JSON exception for query: "+sqlQuery,je);
				}
				
				// Send response
				sendJsonResponse(array, res);
				
			} else {
				// indicates an update count or no results - this must be no results
				throw new ServletException("query returned no results - query: "+sqlQuery);
			}
		} catch (SQLException sqle) {
			throw new ServletException("SQL query failed - query: "+sqlQuery,sqle);
		}
	}

	private void sendJsonResponse(JSONArray array, HttpServletResponse response) throws ServletException {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/javascript");
		response.setHeader("Cache-Control", "no-cache,must-revalidate");
		response.setDateHeader("Expires", (new Date()).getTime());
		
		try {
			OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
			array.write(osw);
			osw.flush();
		} catch(Exception e) {
			throw new ServletException("Failure generating error",e);
		}
	}
	
	public void destroy() {
		connections.closeAllConnections();
	}
}
