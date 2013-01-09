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

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.Connection;
import java.sql.Date; 
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Properties;
import java.util.Vector;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.ServletException;

import org.json.JSONArray;
import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Searches {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	static final public String PROPERTIES_KEY_CONTRIBUTIONS_TABLE_NAME = "contributions.tableName";
	static final public String PROPERTIES_KEY_CONTRIBUTIONS_ID_COLUMN_NAME = "contributions.idColumnName";
	static final public String PROPERTIES_KEY_CONTRIBUTIONS_SELECT_FIELDS = "contributions.selectFields";
	static final public String PROPERTIES_KEY_CONTRIBUTIONS_SELECT_TYPES = "contributions.selectTypes";
	static final public String PROPERTIES_KEY_CONTRIBUTIONS_SEARCH_FIELDS = "contributions.searchFields";
	static final public String PROPERTIES_KEY_FEATURES_TABLE_NAME = "features.tableName";
	static final public String PROPERTIES_KEY_FEATURES_ID_COLUMN_NAME = "features.idColumnName";
	static final public String PROPERTIES_KEY_FEATURES_SELECT_FIELDS = "features.selectFields";
	static final public String PROPERTIES_KEY_FEATURES_SELECT_TYPES = "features.selectTypes";
	static final public String PROPERTIES_KEY_FEATURES_SEARCH_FIELDS = "features.searchFields";

	static final public String DEFAULT_CONTRIBUTIONS_TABLE_NAME = "contributions";
	static final public String DEFAULT_CONTRIBUTIONS_ID_COLUMN_NAME = "id";
	static final public String DEFAULT_KEY_CONTRIBUTIONS_SELECT_FIELDS = "filename,mimetype,related_to";
	static final public String DEFAULT_KEY_CONTRIBUTIONS_SELECT_TYPES = "string,string,integer";
	static final public String DEFAULT_KEY_CONTRIBUTIONS_SEARCH_FIELDS = "title,notes";
	static final public String DEFAULT_FEATURES_TABLE_NAME = "names";
	static final public String DEFAULT_FEATURES_ID_COLUMN_NAME = "id";
	static final public String DEFAULT_KEY_FEATURES_SELECT_FIELDS = "";
	static final public String DEFAULT_KEY_FEATURES_SELECT_TYPES = "";
	static final public String DEFAULT_KEY_FEATURES_SEARCH_FIELDS = "placename,syllabics,meaning,alt_name,moreinfo,questions,entity,source";
	
	private Connection connection;
	static private SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");

	private String contributionsTableName;
	private String contributionsIdColumnName;
	private List<String> contributionsSelectFields = new Vector<String>();
	private List<String> contributionsSelectTypes = new Vector<String>();
	private List<String> contributionsSearchFields = new Vector<String>();
	
	private String featuresTableName;
	private String featuresIdColumnName;
	private List<String> featuresSelectFields = new Vector<String>();
	private List<String> featuresSelectTypes = new Vector<String>();
	private List<String> featuresSearchFields = new Vector<String>();
	
	public Searches(Properties props, Connection connection) {
		this.connection = connection;

		readProperties(props);
	}

	private void readProperties(Properties props) {
		contributionsTableName = props.getProperty(PROPERTIES_KEY_CONTRIBUTIONS_TABLE_NAME, DEFAULT_CONTRIBUTIONS_TABLE_NAME);
		contributionsIdColumnName = props.getProperty(PROPERTIES_KEY_CONTRIBUTIONS_ID_COLUMN_NAME, DEFAULT_CONTRIBUTIONS_ID_COLUMN_NAME);
		featuresTableName = props.getProperty(PROPERTIES_KEY_FEATURES_TABLE_NAME, DEFAULT_FEATURES_TABLE_NAME);
		featuresIdColumnName = props.getProperty(PROPERTIES_KEY_CONTRIBUTIONS_ID_COLUMN_NAME, DEFAULT_CONTRIBUTIONS_ID_COLUMN_NAME);
		
		// Load search and select fields
		{
			String selectFieldsParams = props.getProperty(PROPERTIES_KEY_CONTRIBUTIONS_SELECT_FIELDS, DEFAULT_KEY_CONTRIBUTIONS_SELECT_FIELDS);
			String[] selectFieldArray = selectFieldsParams.split(",");
			for(int loop=0; loop<selectFieldArray.length; ++loop) {
				String selectField = selectFieldArray[loop].trim();
				if( false == "".equals(selectField) ) {
					contributionsSelectFields.add(selectField);
				}
			}
		}
		{
			String selectTypesParams = props.getProperty(PROPERTIES_KEY_CONTRIBUTIONS_SELECT_TYPES, DEFAULT_KEY_CONTRIBUTIONS_SELECT_TYPES);
			String[] selectTypeArray = selectTypesParams.split(",");
			for(int loop=0; loop<selectTypeArray.length; ++loop) {
				String selectType = selectTypeArray[loop].trim();
				if( false == "".equals(selectType) ) {
					contributionsSelectTypes.add(selectType);
				}
			}
		}
		{
			String searchFieldsParams = props.getProperty(PROPERTIES_KEY_CONTRIBUTIONS_SEARCH_FIELDS, DEFAULT_KEY_CONTRIBUTIONS_SEARCH_FIELDS);
			String[] searchFieldArray = searchFieldsParams.split(",");
			for(int loop=0; loop<searchFieldArray.length; ++loop) {
				String searchField = searchFieldArray[loop].trim();
				if( false == "".equals(searchField) ) {
					contributionsSearchFields.add(searchField);
				}
			}
		}
		{
			String selectFieldsParams = props.getProperty(PROPERTIES_KEY_FEATURES_SELECT_FIELDS, DEFAULT_KEY_FEATURES_SELECT_FIELDS);
			String[] selectFieldArray = selectFieldsParams.split(",");
			for(int loop=0; loop<selectFieldArray.length; ++loop) {
				String selectField = selectFieldArray[loop].trim();
				if( false == "".equals(selectField) ) {
					featuresSelectFields.add(selectField);
				}
			}
		}
		{
			String selectTypesParams = props.getProperty(PROPERTIES_KEY_FEATURES_SELECT_TYPES, DEFAULT_KEY_FEATURES_SELECT_TYPES);
			String[] selectTypeArray = selectTypesParams.split(",");
			for(int loop=0; loop<selectTypeArray.length; ++loop) {
				String selectType = selectTypeArray[loop].trim();
				if( false == "".equals(selectType) ) {
					featuresSelectTypes.add(selectType);
				}
			}
		}
		{
			String searchFieldsParams = props.getProperty(PROPERTIES_KEY_FEATURES_SEARCH_FIELDS, DEFAULT_KEY_FEATURES_SEARCH_FIELDS);
			String[] searchFieldArray = searchFieldsParams.split(",");
			for(int loop=0; loop<searchFieldArray.length; ++loop) {
				String searchField = searchFieldArray[loop].trim();
				if( false == "".equals(searchField) ) {
					featuresSearchFields.add(searchField);
				}
			}
		}
	}

	private String getContributionsTableName() {
		return contributionsTableName;
	}

	private String getContributionsIdColumnName() {
		return contributionsIdColumnName;
	}
	
	private String getFeaturesTableName() {
		return featuresTableName;
	}

	private String getFeaturesIdColumnName() {
		return featuresIdColumnName;
	}
	
	private boolean geometryIsPoint(String id, boolean isId) throws Exception {
		String featuresTable = new String (getFeaturesTableName());
		int value = Integer.parseInt(id);
		String field = "id";
		if (!isId) {
			field = "place_id";
		}
		PreparedStatement stmt = connection.prepareStatement("SELECT " + field + ",ST_GeometryType(the_geom) as type FROM " + featuresTable + " WHERE " + field + "=?;");
		stmt.setInt(1, value);
		
		if (stmt.execute()) { // There's a ResultSet to be had
			ResultSet rs = stmt.getResultSet();
			if (rs.next()) {
				String type = rs.getString(2);
				if ("st_point".equalsIgnoreCase(type)) {
					return(true);
				} else {
					return(false);
				}
			} else {
				throw new Exception("Couldn't parse geometry type result");
			}
		} else { // indicates an update count or no results - this must be no results
			throw new Exception("Query returned no results");
		}
	}
	
	private String getGeomCentroidSelectExpressions(String id, boolean isId) throws Exception {
		if (geometryIsPoint(id, isId)) {
			return("ST_X(the_geom),ST_Y(the_geom)");
		} else {
			return("ST_X(ST_Centroid(ST_GeometryN(the_geom,1))),ST_Y(ST_Centroid(ST_GeometryN(the_geom,1)))");
		}
	}
	
	public JSONObject findGeometryCentroidFromId(String id) throws Exception {
		String geomSelectClauses = getGeomCentroidSelectExpressions(id, true);
		String featuresTable = new String (getFeaturesTableName());
		int value = Integer.parseInt(id);
		PreparedStatement stmt = connection.prepareStatement("SELECT id,place_id," + geomSelectClauses + " FROM " + featuresTable + " WHERE id=?;");
		stmt.setInt(1, value);
		
		return findGeometryFromStatement(stmt);
	}

	public JSONObject findGeometryCentroidFromPlace(String id) throws Exception {
		String geomSelectClauses = getGeomCentroidSelectExpressions(id, false);
		String featuresTable = new String(getFeaturesTableName());
		int value = Integer.parseInt(id);
		PreparedStatement stmt = connection.prepareStatement("SELECT id,place_id," + geomSelectClauses + " FROM " + featuresTable + " WHERE place_id=?;");
		stmt.setInt(1, value);
		
		return findGeometryFromStatement(stmt);
	}

	private JSONObject findGeometryFromStatement(PreparedStatement stmt) throws Exception {
		if( stmt.execute() ) {
			// There's a ResultSet to be had
			ResultSet rs = stmt.getResultSet();

			JSONArray array = new JSONArray();
			try {
				while (rs.next()) {
					JSONObject obj = new JSONObject();
					
					obj.put("id",rs.getInt(1));
					obj.put("place_id",rs.getInt(2));
					obj.put("x",rs.getDouble(3));
					obj.put("y",rs.getDouble(4));
					
					array.put(obj);
				}
			} catch (Exception je) {
				throw new ServletException("Error while parsing results",je);
			}
			
			JSONObject result = new JSONObject();
			result.put("features", array);
			
			return result;
			
		} else {
			// indicates an update count or no results - this must be no results
			throw new Exception("Query returned no results");
		}
	}

	private JSONObject searchTableFieldsFromContent(
			String searchString,
			String tableName,
			String idField,
			List<String> searchFields,
			String returnTag,
			List<String> selectFields,
			List<String> selectTypes,
			boolean includeContribInfo_hack) throws Exception {
		List<SelectedColumn> searchFieldsList = new Vector<SelectedColumn>();
		List<SelectedColumn> selectFieldsList = new Vector<SelectedColumn>();
		List<SelectedColumn> scoreFieldsList = new Vector<SelectedColumn>();
		searchFieldsList.add( new SelectedColumn(SelectedColumn.Type.INTEGER, idField) );
		searchFieldsList.add( new SelectedColumn(SelectedColumn.Type.INTEGER, "place_id") );
		if (includeContribInfo_hack) {
			searchFieldsList.add( new SelectedColumn(SelectedColumn.Type.INTEGER, "contributor_id"));
		}
		for(String searchField : searchFields) {
			searchFieldsList.add( new SelectedColumn(SelectedColumn.Type.STRING, searchField) );
		}
		if (null != selectFields) {
			for (int i=0; i<selectFields.size(); i++) {
				String selectField = selectFields.get(i);
				String selectType = "string";
				if (null != selectTypes) {
					selectType = selectTypes.get(i); // this will blow up if selectTypes defined but not the same length as selectFields
				}
				if ("string".equalsIgnoreCase(selectType)) {
					selectFieldsList.add(new SelectedColumn(SelectedColumn.Type.STRING, selectField));
				} else if ("integer".equalsIgnoreCase(selectType)) {
					selectFieldsList.add(new SelectedColumn(SelectedColumn.Type.INTEGER, selectField));
				} else if ("date".equalsIgnoreCase(selectType)) {
					selectFieldsList.add(new SelectedColumn(SelectedColumn.Type.DATE, selectField));
				} else {
					throw new Exception("unknown select field type: " + selectType);
				}
			}
		}
		
		String sqlStatement = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			
			pw.print("SELECT ");
			
			boolean first = true;
			for(int loop=0; loop<searchFieldsList.size(); ++loop) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(searchFieldsList.get(loop).getName());
			}
			for(int loop=0; loop<selectFieldsList.size(); ++loop) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(selectFieldsList.get(loop).getName());
			}
			if( searchFields.size() > 0 ) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				String scoreString = computeSelectScore(searchFields);
				pw.print(scoreString);
				pw.print(" AS score");
				scoreFieldsList.add( new SelectedColumn(SelectedColumn.Type.INTEGER, "score") );
			}

			pw.print(" FROM ");
			pw.print(tableName);

			if( searchFields.size() > 0 ) {
				String whereString = computeWhereFragment(searchFields);
				pw.print(whereString);
			}

			if( searchFields.size() > 0 ) {
				String orderString = computeOrderFragment(searchFields);
				pw.print(orderString);
			}
			
			pw.print(";");
			pw.flush();
			sqlStatement = sw.toString();
		}
		
		logger.info("Search SQL for tag (" + returnTag + "): " + sqlStatement);
		
		PreparedStatement stmt = connection.prepareStatement(sqlStatement);

		int index = 1;
		for(int loop=0; loop<searchFields.size(); ++loop) { // parameters in select for score
			stmt.setString(index, searchString);
			++index;
		}
		for(int loop=0; loop<searchFields.size(); ++loop) { // parameters in where
			stmt.setString(index, "%"+searchString+"%");
			++index;
		}
		for(int loop=0; loop<searchFields.size(); ++loop) { // parameters in order by
			stmt.setString(index, searchString);
			++index;
		}
		
		searchFieldsList.addAll(selectFieldsList);
		searchFieldsList.addAll(scoreFieldsList);		
		JSONArray array = executeStatementToJson(stmt, searchFieldsList);

		JSONObject result = new JSONObject();
		result.put(returnTag, array);

		return result;
	}
	
	public JSONObject searchFeaturesFromContent(String searchString) throws Exception {
		return(searchTableFieldsFromContent(
				searchString,
				getFeaturesTableName(),
				getFeaturesIdColumnName(),
				featuresSearchFields,
				"features",
				featuresSelectFields,
				featuresSelectTypes,
				false));
	}


	/**
	 * Create a SQL fragment that can be used to compute a score based
	 * on a search.
	 * 
	 *  For one search field: coalesce(nullif(position(lower(?) IN lower(X)), 0), 9999)
	 *  for multiple fields: least(coalesce(nullif(position(lower(?) IN lower(X)), 0), 9999),...)
	 * 
	 * @param searchFields Columns to search in column
	 * @return SQL fragment to select score
	 * @throws Exception 
	 */
	private String computeSelectScore(List<String> searchFields) throws Exception {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		if( 0 == searchFields.size() ) {
			throw new Exception("Must supply at least one search field");
			
		} else if( 1 == searchFields.size() ) {
			pw.print("coalesce(nullif(position(lower(?) IN lower(");
			pw.print(searchFields.get(0));
			pw.print(")), 0), 9999)");
			
		} else {
			int loop;
			for(loop=0; loop<searchFields.size()-1;++loop) {
				pw.print("least(coalesce(nullif(position(lower(?) IN lower(");
				pw.print(searchFields.get(loop));
				pw.print(")), 0), 9999),");
			}
			
			pw.print("coalesce(nullif(position(lower(?) IN lower(");
			pw.print(searchFields.get(loop));
			pw.print(")), 0), 9999)");
			
			for(loop=0; loop<searchFields.size()-1;++loop) {
				pw.print(")");
			}
		}

		pw.flush();
		return sw.toString();
	}

	/**
	 * Given a number of search fields, compute the SQL fragment
	 * used to filter the searched rows
	 * 
	 * WHERE lower(X) LIKE lower(?)
	 *   OR lower(Y) LIKE lower(?)...
	 * 
	 * @param searchFields Columns to search 
	 * @return
	 * @throws Exception 
	 */
	private String computeWhereFragment(List<String> searchFields) throws Exception {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		boolean first = true;
		for(int loop=0; loop<searchFields.size(); ++loop) {
			if( first ) {
				first = false;
				pw.print(" WHERE ");
			} else {
				pw.print(" OR ");
			}
			pw.print("lower(");
			pw.print(searchFields.get(loop));
			pw.print(") LIKE lower(?)");
		}

		pw.flush();
		return sw.toString();
	}

	/**
	 * Given a number of search fields, compute the SQL fragment
	 * used to order the searched/found rows
	 * 
	 * ORDER BY least(coalesce(nullif(position(lower(?) IN lower(title)), 0), 9999),
				    coalesce(nullif(position(lower(?) IN lower(notes)), 0), 9999)...
	 * 
	 * @param searchFields Columns to search 
	 * @return
	 * @throws Exception 
	 */
	private String computeOrderFragment(List<String> searchFields) throws Exception {
		if( 0 == searchFields.size() ) {
			return "";
		}
		
		return " ORDER BY " + computeSelectScore(searchFields);
	}

	/**
	 * This method executes a prepared SQL statement and returns a JSON
	 * array that contains the result.
	 * @param stmt Prepared SQL statement to execute
	 * @param selectFields Column to return in results
	 * @return A JSONArray containing the requested information
	 * @throws Exception
	 */
	private JSONArray executeStatementToJson(
				PreparedStatement stmt,
				List<SelectedColumn> selectFields) throws Exception {
//logger.info("about to execute: " + stmt.toString());
		if( stmt.execute() ) {
			// There's a ResultSet to be had
			ResultSet rs = stmt.getResultSet();

			JSONArray array = new JSONArray();
			try {
				Map<Integer,JSONObject> contributorMap = new HashMap<Integer,JSONObject>();
				while (rs.next()) {
					JSONObject obj = new JSONObject();

					int index = 1;
					for(int loop=0; loop<selectFields.size(); ++loop) {
						SelectedColumn selCol = selectFields.get(loop);
//logger.info("field: " + selCol.getName() + " (" + selCol.getType() + ")");
					
						if (! "contributor_id".equalsIgnoreCase(selCol.getName())) {
							if( SelectedColumn.Type.INTEGER == selCol.getType() ) {
								obj.put(selCol.getName(),rs.getInt(index));
								++index;

							} else if( SelectedColumn.Type.STRING == selCol.getType() ) {
								obj.put(selCol.getName(),rs.getString(index));
								++index;

							} else if ( SelectedColumn.Type.DATE == selCol.getType() ) {
								Date date = rs.getDate(index);
								if (null != date) {
									String dateString = dateFormatter.format(date);
									obj.put(selCol.getName(), dateString);
								}
								++index;

							} else {
								throw new Exception("Unkown selected column type");
							}
						} else {
							// Convert contributor id into user info
							int contribId = rs.getInt(index);
							JSONObject userInfo = fetchContributorFromIdWithCache(
									contribId, contributorMap);
							if (null != userInfo) {
								obj.put("contributor", userInfo);
							}
							++index;
						}
					}
					
					array.put(obj);
				}
			} catch (Exception je) {
				throw new ServletException("Error while executing statement",je);
			}
			
			return array;
			
		} else {
			// indicates an update count or no results - this must be no results
			throw new Exception("Query returned no results");
		}
	}

	/**
	 * Finds and returns the media to be played/displayed when a
	 * name is visited. This information is fetched from the contributions
	 * table, where the file use is marked as 'hover'.
	 * @param place_id Place id of visited feature
	 * @return
	 * @throws Exception 
	 */
	public JSONObject findHoverMedia(String place_id) throws Exception {

		String featuresTable = new String(getFeaturesTableName());
		
		List<SelectedColumn> selectFields = new Vector<SelectedColumn>();
		selectFields.add( new SelectedColumn(SelectedColumn.Type.INTEGER, "place_id") );
		selectFields.add( new SelectedColumn(SelectedColumn.Type.STRING, "hover_audio") );
		
		PreparedStatement stmt = connection.prepareStatement("SELECT place_id,hover_audio FROM " + featuresTable + " WHERE place_id = ?;");
		stmt.setInt(1, Integer.parseInt(place_id));
		
		JSONArray array = executeStatementToJson(stmt, selectFields);

		JSONObject result = new JSONObject();
		result.put("media", array);

		return result;
	}
	
	public JSONObject searchContributionsFromContent(String searchString) throws Exception {
		return(searchTableFieldsFromContent(
				searchString,
				getContributionsTableName(),
				getContributionsIdColumnName(),
				contributionsSearchFields,
				"contributions",
				contributionsSelectFields,
				contributionsSelectTypes,
				true));
	}

	private JSONObject fetchContributorFromIdWithCache(int contributor_id, Map<Integer,JSONObject> cache) throws Exception {
		JSONObject userInfo = null;
		
		// Convert contributor id into user info
		Integer contId = new Integer(contributor_id);
		if( cache.containsKey(contId) ) {
			userInfo = cache.get(contId);
		} else {
			try {
				userInfo = fetchContributorFromId(contributor_id);
			} catch(Exception e) {
				// Just ignore
			}
			
			// cache
			cache.put(contId, userInfo);
		}
		
		return userInfo;
	}

	private JSONObject fetchContributorFromId(int contributor_id) throws Exception {
		JSONObject userInfo = null;
		
		try {
			PreparedStatement pstmt = connection.prepareStatement("SELECT name,group_id FROM users WHERE id=?;");
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
		
		return userInfo;
	}

	/**
	 * Finds and returns all audio media associated with a place id.
	 * @param place_id Id of associated place
	 * @return A JSON object containing all audio media
	 * @throws Exception 
	 */
	public JSONObject getAudioMediaFromPlaceId(String place_id) throws Exception {

		List<SelectedColumn> selectFields = new Vector<SelectedColumn>();
		selectFields.add( new SelectedColumn(SelectedColumn.Type.INTEGER, "id") );
		selectFields.add( new SelectedColumn(SelectedColumn.Type.INTEGER, "place_id") );
		selectFields.add( new SelectedColumn(SelectedColumn.Type.STRING, "filename") );
		selectFields.add( new SelectedColumn(SelectedColumn.Type.STRING, "mimetype") );
		selectFields.add( new SelectedColumn(SelectedColumn.Type.STRING, "title") );
		
		PreparedStatement stmt = connection.prepareStatement(
				"SELECT id,place_id,filename,mimetype,title " +
				"FROM contributions " +
				"WHERE mimetype LIKE 'audio/%' AND place_id = ?;"
				);
		stmt.setInt(1, Integer.parseInt(place_id));
		
		JSONArray array = executeStatementToJson(stmt, selectFields);

		JSONObject result = new JSONObject();
		result.put("media", array);

		return result;
	}
}
