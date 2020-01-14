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
package ca.carleton.gcrc.dbWeb;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.util.Date;
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

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.auth.common.AuthenticationUtils;
import ca.carleton.gcrc.auth.common.User;
import ca.carleton.gcrc.dbSec.DbSecurity;
import ca.carleton.gcrc.dbSec.DbTableAccess;
import ca.carleton.gcrc.dbSec.Expression;
import ca.carleton.gcrc.dbSec.FieldSelector;
import ca.carleton.gcrc.dbSec.FieldSelectorCentroid;
import ca.carleton.gcrc.dbSec.FieldSelectorColumn;
import ca.carleton.gcrc.dbSec.FieldSelectorFunction;
import ca.carleton.gcrc.dbSec.FieldSelectorScoreSubString;
import ca.carleton.gcrc.dbSec.OrderSpecifier;
import ca.carleton.gcrc.dbSec.RecordSelectorComparison;
import ca.carleton.gcrc.dbSec.TableSchema;
import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.RecordSelectorSearchString;
import ca.carleton.gcrc.jdbc.JdbcConnections;
import ca.carleton.gcrc.json.JSONSupport;

public class DbWebServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	static private Pattern patternEq = Pattern.compile("eq\\((.*)\\)(.*)");
	static private Pattern patternNe = Pattern.compile("ne\\((.*)\\)(.*)");
	static private Pattern patternGe = Pattern.compile("ge\\((.*)\\)(.*)");
	static private Pattern patternLe = Pattern.compile("le\\((.*)\\)(.*)");
	static private Pattern patternGt = Pattern.compile("gt\\((.*)\\)(.*)");
	static private Pattern patternLt = Pattern.compile("lt\\((.*)\\)(.*)");
	static private Pattern patternNull = Pattern.compile("null\\((.*)\\)");
	static private Pattern patternNotNull = Pattern.compile("notNull\\((.*)\\)");
	static private Pattern patternScore = Pattern.compile("score\\((.*)\\)(.*)");
	static private Pattern patternCentroid = Pattern.compile("centroid\\(([xy]),(.*)\\)");

	static private Pattern patternSum = Pattern.compile("sum\\((.*)\\)");
	static private Pattern patternMin = Pattern.compile("min\\((.*)\\)");
	static private Pattern patternMax = Pattern.compile("max\\((.*)\\)");

	static private Pattern patternSearchString = Pattern.compile("search\\((.*)\\)(.*)");

	static private Pattern patternOrderBy = Pattern.compile("([ad]),(.*)");
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private JdbcConnections connections = null;
	Connection connection = null;
	private DbSecurity dbSecurity = null;
	
	/**
	 * This servlet gives access to database tables to web clients by combining
	 * the authentication from olkit-auth and the secure access implemented
	 * in olkit-dbSec.
	 */
	public DbWebServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);

		try {
			connections = JdbcConnections.connectionsFromServletContext(config.getServletContext());
			connection = connections.getDb();
		} catch (Exception e) {
			throw new ServletException("Error while connecting to database",e);
		}
		
		dbSecurity = new DbSecurity(connection);
	}

	public void destroy() {
		connections.closeAllConnections();
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		
		logger.info(this.getClass().getName()+" "+path);

		try {
			if( "getSchema".equalsIgnoreCase(path) ) {
				performGetSchema(request, response);

			} else if ( "getCapabilities".equalsIgnoreCase(path) ) {
				performGetCapabilities(request, response);

			} else if ( "query".equalsIgnoreCase(path) ) {
				performQuery(request, response);

			} else if ( "queries".equalsIgnoreCase(path) ) {
				performMultiQuery(request, response);

			} else if ( "insert".equalsIgnoreCase(path) ) {
				performInsert(request, response);

			} else if ( "update".equalsIgnoreCase(path) ) {
				performUpdate(request, response);

			} else if ( "delete".equalsIgnoreCase(path) ) {
				performDelete(request, response);
				
			} else {
				throw new Exception("Unknown request: "+path);
			}
		} catch(Exception e) {
			logger.info("Error encountered while performing: "+path,e);
			sendErrorResponse(response, e);
		}
	}
	
	private void performGetSchema(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);
		String tableName = getTableNameFromRequest(request);
		
		DbTableAccess tableAccess = DbTableAccess.getAccess(dbSecurity, tableName, new DbUserAdaptor(user));
		JSONObject schema = tableAccess.getSchema();
		
		sendJsonResponse(response, schema);
	}
	
	private void performGetCapabilities(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);

		List<TableSchema> tableSchemas = dbSecurity.getAvailableTablesFromGroups( new DbUserAdaptor(user) );

		JSONArray array = new JSONArray();
		for(TableSchema schema : tableSchemas) {
			array.put( schema.toJSON() );
		}
		
		JSONObject capabilities = new JSONObject();
		capabilities.put("capabilities", array);
		
		sendJsonResponse(response, capabilities);
	}
	
	/**
	 * Perform a SQL query of a specified table, that must be accessible via dbSec.
	 * 
	 * The http parms must include:
	 * table=<tableName> specifying a valid and accessible table.
	 * 
	 * the http parms may include one or more (each) of:
	 * select=<e1>[,<e2>[,...]] where each <ei> is the name of a valid and accessible column or
	 * is an expression of one of the forms:
	 *    sum(<c>), max(<c>), min(<c>)
	 *    where <c> is the name of a valid and accessible column.
	 * 
	 * groupBy=<c1>[,<c2>[,...]] where each <ci> is the name of a valid and accessible column.
	 * 
	 * where=<whereclause> where multiple where clauses are combined using logical AND and
	 * <whereClause> is of the form:
	 *   <c>,<comparator>
	 *   where <c> is the name of a valid and accessible column, and
	 *         <comparator> is one of:
	 *             eq(<value>) where value is a valid comparison value for the column's data type.
	 *             ne(<value>) where value is a valid comparison value for the column's data type.
	 *             ge(<value>) where value is a valid comparison value for the column's data type.
	 *             le(<value>) where value is a valid comparison value for the column's data type.
	 *             gt(<value>) where value is a valid comparison value for the column's data type.
	 *             lt(<value>) where value is a valid comparison value for the column's data type.
	 *             isNull.
	 *             isNotNull.
	 * 
	 * @param request http request containing the query parameters.
	 * @param response http response to be sent.
	 * @throws Exception (for a variety of reasons detected while parsing and validating the http parms).
	 */
	private void performQuery(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);
		String tableName = getTableNameFromRequest(request);
		
		DbTableAccess tableAccess = DbTableAccess.getAccess(dbSecurity, tableName, new DbUserAdaptor(user));
		
		List<RecordSelector> whereMap = getRecordSelectorsFromRequest(request);
		List<FieldSelector> selectSpecifiers = getFieldSelectorsFromRequest(request);
		List<FieldSelector> groupByColumnNames = getGroupByFromRequest(request);
		List<OrderSpecifier> orderBy = getOrderByList(request);
		Integer limit = getLimitFromRequest(request);
		Integer offset = getOffsetFromRequest(request);
		
		JSONArray queriedObjects = tableAccess.query(
				whereMap
				,selectSpecifiers
				,groupByColumnNames
				,orderBy
				,limit
				,offset
				);
		
		JSONObject obj = new JSONObject();
		obj.put("queried", queriedObjects);
		
		sendJsonResponse(response, obj);
	}
	
	/**
	 * Perform multiple SQL queries via dbSec.
	 * 
	 * queries = {
	 *   key1: {
	 *   	table: <table name>
	 *   	,select: [
	 *   		<selectExpression>
	 *   		,...
	 *   	]
	 *   	,where: [
	 *   		'<columnName>,<comparator>'
	 *   		,'<columnName>,<comparator>'
	 *   		,...
	 *   	]
	 *   	,groupBy: [
	 *   		<columnName>
	 *   		,...
	 *   	]
	 *   }
	 *   ,key2: {
	 *    ...
	 *   }
	 *   , ...
	 * }
	 * 
	 * <selectExpression> : 
	 *             <columnName>
	 *             sum(<columnName>)
	 *             min(<columnName>)
	 *             max(<columnName>)
	 * <comparator> :
	 *             eq(<value>) where value is a valid comparison value for the column's data type.
	 *             ne(<value>) where value is a valid comparison value for the column's data type.
	 *             ge(<value>) where value is a valid comparison value for the column's data type.
	 *             le(<value>) where value is a valid comparison value for the column's data type.
	 *             gt(<value>) where value is a valid comparison value for the column's data type.
	 *             lt(<value>) where value is a valid comparison value for the column's data type.
	 *             isNull.
	 *             isNotNull.
	 * 
	 * response = {
	 *	 key1: [
	 *		{ c1: 1, c2: 2 }
	 *		,{ c1: 4, c2: 5 }
	 *		,...
	 *	 ]
	 *	 ,key2: {
	 *		error: 'Error message'
	 *   }
	 *   ,...
	 * }
	 * 
	 * @param request http request containing the query parameters.
	 * @param response http response to be sent.
	 * @throws Exception (for a variety of reasons detected while parsing and validating the http parms).
	 */
	private void performMultiQuery(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);

		String[] queriesStrings = request.getParameterValues("queries");
		if( 1 != queriesStrings.length ) {
			throw new Exception("Parameter 'queries' must be specified exactly oncce");
		}

		// Create list of Query instances
		List<Query> queries = parseQueriesJson(queriesStrings[0]);

		// Perform queries
		JSONObject result = new JSONObject();
		{
			Map<String, DbTableAccess> tableAccessCache = new HashMap<String, DbTableAccess>(); 
			for(Query query : queries) {
				String tableName = query.getTableName();
				List<RecordSelector> whereMap = query.getWhereExpressions();
				List<FieldSelector> fieldSelectors = query.getFieldSelectors();
				List<FieldSelector> groupByColumnNames = query.getGroupByColumnNames();
				List<OrderSpecifier> orderSpecifiers = query.getOrderBySpecifiers();
				Integer limit = query.getLimit();
				Integer offset = query.getOffset();
				
				DbTableAccess tableAccess = tableAccessCache.get(tableName);
				if( null == tableAccess ) {
					tableAccess = DbTableAccess.getAccess(dbSecurity, tableName, new DbUserAdaptor(user));
					tableAccessCache.put(tableName, tableAccess);
				}
				
				try {
					JSONArray queriedObjects = tableAccess.query(
							whereMap
							,fieldSelectors
							,groupByColumnNames
							,orderSpecifiers
							,limit
							,offset
							);
					result.put(query.getQueryKey(), queriedObjects);
				} catch(Exception e) {
					result.put(query.getQueryKey(), errorToJson(e));
				}
			}
		}
		
		sendJsonResponse(response, result);
	}
	
	protected List<Query> parseQueriesJson(String queriesString) throws Exception {
		// Parse request into a JSON object
		JSONObject jsonObj = null;
		{
			JSONTokener jsonTokener = new JSONTokener(queriesString);
			Object obj = jsonTokener.nextValue();
			if( obj instanceof JSONObject ) {
				jsonObj = (JSONObject)obj;
			} else {
				throw new Exception("Unexpected object type for queries: "+obj.getClass().getSimpleName());
			}
		}
		
		// Create list of Query instances
		List<Query> queries = new Vector<Query>();
		{
			Iterator<?> itKey = jsonObj.keys();
			while( itKey.hasNext() ) {
				Object keyObj = itKey.next();
				if( false == (keyObj instanceof String) ) {
					throw new Exception("Invalid encoding of queries (non-string key)");
				}
				String key = (String)keyObj;
				JSONObject jsonQuery = jsonObj.getJSONObject(key);
				if( null == jsonQuery ) {
					throw new Exception("Invalid encoding of queries (null query)");
				}
				
				Query query = parseQueryJson(key, jsonQuery);
				queries.add( query );
			}
		}
		
		return queries;
	}
	
	protected Query parseQueryJson(String key, JSONObject jsonQuery) throws Exception {
		String tableName = jsonQuery.getString("table");
		if( null == tableName ) {
			throw new Exception("Invalid query : missing 'table' parameter");
		}
		
		Query query = new Query(key, tableName);

		// Where expressions
		{
			List<RecordSelector> whereExpressions = null;
			if( JSONSupport.containsKey(jsonQuery,"where") ) {
				JSONArray whereArray = jsonQuery.getJSONArray("where");
				whereExpressions = new Vector<RecordSelector>();
				
				for(int loop=0; loop<whereArray.length(); ++loop) {
					String wherePair = whereArray.getString(loop);
					if( null == wherePair ) {
						throw new Exception("Invalid query : null where expression");
					}
					RecordSelector columnComparison = parseRecordSelector(wherePair);
					
					whereExpressions.add(columnComparison);
				}
				
				query.setWhereExpressions(whereExpressions);
			}
		}

		// Field selectors
		{
			List<FieldSelector> fieldSelectors = null;
			if( JSONSupport.containsKey(jsonQuery,"select") ) {
				JSONArray selectArray = jsonQuery.getJSONArray("select");
				fieldSelectors = new Vector<FieldSelector>();
				
				for(int loop=0; loop<selectArray.length(); ++loop) {
					String select = selectArray.getString(loop);
					if( null == select ) {
						throw new Exception("Invalid query : field selector must be a string");
					}
					FieldSelector fieldSelector = parseFieldSelectorString(select);
					
					fieldSelectors.add(fieldSelector);
				}
				
				query.setFieldSelectors(fieldSelectors);
			}
		}

		// GroupBy expressions
		{
			if( JSONSupport.containsKey(jsonQuery,"groupBy") ) {
				JSONArray groupByArray = jsonQuery.getJSONArray("groupBy");
				List<FieldSelector> groupByColumnNames = new Vector<FieldSelector>();
				
				for(int loop=0; loop<groupByArray.length(); ++loop) {
					String fieldSelector = groupByArray.getString(loop);
					if( null == fieldSelector ) {
						throw new Exception("Invalid query : groupBy specifier must be a string");
					}
					
					groupByColumnNames.add( parseFieldSelectorString(fieldSelector) );
				}
				
				query.setGroupByColumnNames(groupByColumnNames);
			}
		}

		// OrderBy expressions
		{
			if( JSONSupport.containsKey(jsonQuery,"orderBy") ) {
				JSONArray orderByArray = jsonQuery.getJSONArray("orderBy");
				
				List<OrderSpecifier> orderBySpecifiers = new Vector<OrderSpecifier>();
				
				for(int loop=0; loop<orderByArray.length(); ++loop) {
					String orderByString = orderByArray.getString(loop);
					if( null == orderByString ) {
						throw new Exception("Invalid query : orderBy specifier must be a string");
					}
					OrderSpecifier orderSpecifier = parseOrderSpecifier(orderByString);
					orderBySpecifiers.add( orderSpecifier );
				}
				
				query.setOrderBySpecifiers(orderBySpecifiers);
			}
		}
		
		// Limit
		{
			if( JSONSupport.containsKey(jsonQuery,"limit") ) {
				int limit = jsonQuery.getInt("limit");
				query.setLimit(limit);
			}
		}
		
		// offset
		{
			if( JSONSupport.containsKey(jsonQuery,"offset") ) {
				int offset = jsonQuery.getInt("offset");
				query.setOffset(offset);
			}
		}

		return query;
	}

	private void performInsert(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);
		String tableName = getTableNameFromRequest(request);
		
		DbTableAccess tableAccess = DbTableAccess.getAccess(dbSecurity, tableName, new DbUserAdaptor(user));

		Map<String,String> setterMap = getSetParametersMap(request);

		JSONObject insertedObj = tableAccess.insert(setterMap);
		
		JSONObject obj = new JSONObject();
		obj.put("inserted", insertedObj);
		
		sendJsonResponse(response, obj);
	}
	
	private void performUpdate(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);
		String tableName = getTableNameFromRequest(request);
		
		DbTableAccess tableAccess = DbTableAccess.getAccess(dbSecurity, tableName, new DbUserAdaptor(user));
		
		List<RecordSelector> whereMap = getRecordSelectorsFromRequest(request);
		Map<String,String> setterMap = getSetParametersMap(request);

		JSONArray updatedObjects = tableAccess.update(whereMap, setterMap);
		
		JSONObject obj = new JSONObject();
		obj.put("updated", updatedObjects);
		
		sendJsonResponse(response, obj);
	}
	
	private void performDelete(HttpServletRequest request, HttpServletResponse response) throws Exception {
		User user = AuthenticationUtils.getUserFromRequest(request);
		String tableName = getTableNameFromRequest(request);
		
		DbTableAccess tableAccess = DbTableAccess.getAccess(dbSecurity, tableName, new DbUserAdaptor(user));
		
		List<RecordSelector> whereMap = getRecordSelectorsFromRequest(request);

		tableAccess.delete(whereMap);
		
		JSONObject obj = new JSONObject();
		
		sendJsonResponse(response, obj);
	}
	
	private String getTableNameFromRequest(HttpServletRequest request) throws Exception {

		String[] tableNames = request.getParameterValues("table");
		if( null == tableNames || 0 == tableNames.length ) {
			throw new Exception("Parameter 'table' not specified");
		}
		if( tableNames.length > 1 ) {
			throw new Exception("Parameter 'table' specified multiple times");
		}
		
		return tableNames[0];
	}
	
	private List<RecordSelector> getRecordSelectorsFromRequest(HttpServletRequest request) throws Exception {
		List<RecordSelector> result = new Vector<RecordSelector>();

		String[] whereExpressions = request.getParameterValues("where");
		if( null != whereExpressions ) {
			for(int loop=0; loop<whereExpressions.length; ++loop) {
				String exp = whereExpressions[loop];
				
				RecordSelector rs = parseRecordSelector(exp);
				if (null != rs) {
					result.add(rs);
				}
			}
		}
		
		return result;
	}
	
	 /* 
	 *   eq(<column>)<value>
	 *   ne(<column>)<value>
	 *   ge(<column>)<value>
	 *   le(<column>)<value>
	 *   gt(<column>)<value>
	 *   lt(<column>)<value>
	 *   null(<column>)
	 *   notNull(<column>)
	 *   search(<columnName>,<columnName>,...)<string>
	 */
	private RecordSelector parseRecordSelector(String recordSelectorString) throws Exception {
		if (null == recordSelectorString || "" == recordSelectorString) {
			return null;
		}
		
		{
			Matcher matcher = patternSearchString.matcher(recordSelectorString);
			if( matcher.matches() ) {
				String[] fieldNames = matcher.group(1).split(",");
				String searchString = matcher.group(2);
				return new RecordSelectorSearchString(fieldNames, searchString);
			}
		}
		
		// EQ
		{
			Matcher matcher = patternEq.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.EQUAL
					,matcher.group(2)
					);
			}
		}
		
		// NE
		{
			Matcher matcher = patternNe.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.NOT_EQUAL
					,matcher.group(2)
					);
			}
		}
		
		// GT
		{
			Matcher matcher = patternGt.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.GREATER_THAN
					,matcher.group(2)
					);
			}
		}
		
		// GE
		{
			Matcher matcher = patternGe.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.GREATER_THAN_OR_EQUAL
					,matcher.group(2)
					);
			}
		}
		
		// LT
		{
			Matcher matcher = patternLt.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.LESS_THAN
					,matcher.group(2)
					);
			}
		}
		
		// LE
		{
			Matcher matcher = patternLe.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.LESS_THAN_OR_EQUAL
					,matcher.group(2)
					);
			}
		}
		
		// NULL
		{
			Matcher matcher = patternNull.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.IS_NULL
					,(Expression)null
					);
			}
		}
		
		// NOT NULL
		{
			Matcher matcher = patternNotNull.matcher(recordSelectorString);
			if( matcher.matches() ) {
				return new RecordSelectorComparison(
					matcher.group(1)
					,RecordSelectorComparison.Comparison.IS_NOT_NULL
					,(Expression)null
					);
			}
		}

		throw new Exception("Invalid query : can not parse record selector: "+recordSelectorString);
	}
	
	/**
	 * Return a list of column names to be included in a select clause.
	 * @param request http request containing a (possibly empty) set of 'select' parms.  Each select
	 * parm may contain a comma-separated list of column names.
	 * @return List of column names specified by those select parameters
	 * @throws Exception
	 */
	private List<FieldSelector> getFieldSelectorsFromRequest(HttpServletRequest request) throws Exception {
		
		String[] fieldSelectorStrings = request.getParameterValues("select");
		if( null == fieldSelectorStrings ) {
			return null;
		}
		if( 0 == fieldSelectorStrings.length ) {
			return null;
		}
		
		List<FieldSelector> result = new Vector<FieldSelector>();
		for(String fieldSelectorString : fieldSelectorStrings) {
			FieldSelector fieldSelector = parseFieldSelectorString(fieldSelectorString);
			result.add(fieldSelector);
		}
		
		return result;
	}
	
	private FieldSelector parseFieldSelectorString(String fieldSelectorString) throws Exception {

		// SUM
		{
			Matcher matcher = patternSum.matcher(fieldSelectorString);
			if( matcher.matches() ) {
				return new FieldSelectorFunction(FieldSelectorFunction.Type.SUM, matcher.group(1));
			}
		}

		// MIN
		{
			Matcher matcher = patternMin.matcher(fieldSelectorString);
			if( matcher.matches() ) {
				return new FieldSelectorFunction(FieldSelectorFunction.Type.MIN, matcher.group(1));
			}
		}

		// MAX
		{
			Matcher matcher = patternMax.matcher(fieldSelectorString);
			if( matcher.matches() ) {
				return new FieldSelectorFunction(FieldSelectorFunction.Type.MAX, matcher.group(1));
			}
		}

		// Score
		{
			Matcher matcher = patternScore.matcher(fieldSelectorString);
			if( matcher.matches() ) {
				String[] fieldNames = matcher.group(1).split(",");
				String searchString = matcher.group(2);
				return new FieldSelectorScoreSubString(fieldNames,searchString);
			}
		}
		
		// Centroid
		{
			Matcher matcher = patternCentroid.matcher(fieldSelectorString);
			if( matcher.matches() ) {
				String typeString = matcher.group(1);
				String fieldName = matcher.group(2);
				FieldSelectorCentroid.Type type = null;
				if( "x".equals(typeString) ) {
					type = FieldSelectorCentroid.Type.X;
				} else if( "y".equals(typeString) ) {
					type = FieldSelectorCentroid.Type.Y;
				} else {
					throw new Exception("Invalid FieldSelector centroid: "+fieldSelectorString);
				}
				return new FieldSelectorCentroid(fieldName,type);
			}
		}

		return new FieldSelectorColumn(fieldSelectorString);
	}
	
	private OrderSpecifier parseOrderSpecifier(String orderSpecifierString) throws Exception {

		Matcher matcher = patternOrderBy.matcher(orderSpecifierString);
		if( false == matcher.matches() ) {
			throw new Exception("Can not parse OrderBy specifier: "+orderSpecifierString);
		}
		
		// First is type
		OrderSpecifier.Type type = null;
		{
			String typeString = matcher.group(1);
			if( "a".equals(typeString) ) {
				type = OrderSpecifier.Type.ASCENDING;
			} else if( "d".equals(typeString) ) {
				type = OrderSpecifier.Type.DESCENDING;
			} else {
				throw new Exception("Invalid orderBy type: "+typeString);
			}
		}
		
		// Second is field selector
		FieldSelector fieldSelector = null;
		{
			String fieldSelectorString = matcher.group(2);
			fieldSelector = parseFieldSelectorString(fieldSelectorString);
		}
		
		return new OrderSpecifier(type,fieldSelector);
	}
	
	/**
	 * Return a list of column names to be included in a GROUP BY clause.
	 * @param request http request containing a (possibly empty) set of 'groupBy' parms.  Each
	 * groupBy parm may contain a comma-separated list of column names.
	 * @return List of column names specified by those groupBy parameters
	 * @throws Exception
	 */
	private List<FieldSelector> getGroupByFromRequest(HttpServletRequest request) throws Exception {
		
		String[] fieldSelectorStrings = request.getParameterValues("groupBy");
		if( null == fieldSelectorStrings ) {
			return null;
		}
		if( 0 == fieldSelectorStrings.length ) {
			return null;
		}
		
		List<FieldSelector> result = new Vector<FieldSelector>();
		for(String fieldSelectorString : fieldSelectorStrings) {
			FieldSelector fieldSelector = parseFieldSelectorString(fieldSelectorString);
			result.add(fieldSelector);
		}
		
		return result;
	}
	
	/**
	 * Return a list of order specifiers found in request
	 * @param request http request containing a (possibly empty) set of 'orderBy' parms.
	 * @return List of order specifiers given by those orderBy parameters
	 * @throws Exception
	 */
	private List<OrderSpecifier> getOrderByList(HttpServletRequest request) throws Exception {
		String[] orderByStrings = request.getParameterValues("orderBy");
		if( null == orderByStrings ) {
			return null;
		}
		if( 0 == orderByStrings.length ) {
			return null;
		}
		
		List<OrderSpecifier> result = new Vector<OrderSpecifier>();
		
		for(String orderByString : orderByStrings) {
			OrderSpecifier orderSpecifier = parseOrderSpecifier(orderByString);
			result.add(orderSpecifier);
		}

		return result;
	}

	private Integer getLimitFromRequest(HttpServletRequest request) throws Exception {
		String[] limitStrings = request.getParameterValues("limit");
		if( null == limitStrings ) {
			return null;
		}
		if( 0 == limitStrings.length ) {
			return null;
		}
		if( limitStrings.length > 1 ) {
			throw new Exception("limit can only be specified once");
		}
		
		int limit = Integer.parseInt(limitStrings[0]);
		return limit;
	}

	private Integer getOffsetFromRequest(HttpServletRequest request) throws Exception {
		String[] offsetStrings = request.getParameterValues("offset");
		if( null == offsetStrings ) {
			return null;
		}
		if( 0 == offsetStrings.length ) {
			return null;
		}
		if( offsetStrings.length > 1 ) {
			throw new Exception("Offset can only be specified once");
		}
		
		int offset = Integer.parseInt(offsetStrings[0]);
		return offset;
	}
	
	private Map<String,String> getSetParametersMap(HttpServletRequest request) throws Exception {
		Map<String,String> setterMap = new HashMap<String,String>();

		String[] setters = request.getParameterValues("set");
		if( null != setters ) {
			for(int loop=0; loop<setters.length; ++loop) {
				String setString = setters[loop];
				int sepIndex = setString.indexOf(',');
				if( sepIndex < 0 ) {
					throw new Exception("Malformed setter: "+setString);
				}
				String key = setString.substring(0, sepIndex);
				String value = setString.substring(sepIndex+1);
				if( setterMap.containsKey(key) ) {
					throw new Exception("Setter specified multiple times: "+key);
				}
				setterMap.put(key, value);
			}
		}
		
		return setterMap;
	}
	
	private void sendJsonResponse(HttpServletResponse response, JSONObject result) throws Exception {

		response.setStatus(HttpServletResponse.SC_OK);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");
		
		OutputStreamWriter osw = new OutputStreamWriter( response.getOutputStream(), "UTF-8" );
		result.write(osw);
		osw.flush();
	}
	
	private void sendErrorResponse(HttpServletResponse response, Throwable error) throws ServletException {

		response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");
		
		try {
			JSONObject result = new JSONObject();
			result.put("error", errorToJson(error));
			
			OutputStreamWriter osw = new OutputStreamWriter( response.getOutputStream(), "UTF-8" );
			result.write(osw);
			osw.flush();
		} catch(Exception e) {
			throw new ServletException("Failure while serving error",e);
		}
	}
	
	private JSONObject errorToJson(Throwable error) throws Exception {

		JSONObject errorObj = new JSONObject();
		errorObj.put("message", error.getMessage());
		if( null != error.getCause() ) {
			errorObj.put("cause", errorToJson(error.getCause()));
		}
		return errorObj;
	}
}
