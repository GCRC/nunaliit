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
package ca.carleton.gcrc.contributions;

import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.contributionsImpl.ContributionServerSupportedFieldsImpl;
import ca.carleton.gcrc.contributionsImpl.ContributionClientSideFieldsImpl;
import ca.carleton.gcrc.dbSec.impl.ColumnDataUtils;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Vector;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;

import org.json.JSONArray;
import org.json.JSONObject;

public class Contributions {
	final protected Logger logger = Logger.getLogger(this.getClass());

	static final public String PROPERTIES_KEY_TABLE_NAME = "contributions.tableName";
	static final public String PROPERTIES_KEY_ID_COLUMN_NAME = "contributions.idColumnName";
	static final public String PROPERTIES_KEY_ID_SEQUENCE_NAME = "contributions.idSequenceName";
	static final public String PROPERTIES_KEY_SERVER_SUPPORTED_COLUMNS = "contributions.serverSupportedColumns";
	static final public String PROPERTIES_KEY_CLIENT_SIDE_COLUMNS = "contributions.clientSideColumns";
	
	static final public String DEFAULT_TABLE_NAME = "contributions";
	static final public String DEFAULT_ID_COLUMN_NAME = "id";
	static final public String DEFAULT_ID_SEQUENCE_NAME = "contributions_id_seq";
	static final public String DEFAULT_SERVER_SUPPORTED_COLUMNS =
		"id,place_id,contributor_id,create_ts,create_ms,last_edit_timestamp,last_edit_id,filename,original_filename,mimetype,file_size";
	static final public String DEFAULT_CLIENT_SIDE_COLUMNS =
		"title,notes,fileuse,likes,dislikes,related_to";
	
	private ContributionComet contributionComet = new ContributionCometNull();
	private Connection connection;
	private String tableName;
	private String idColumnName;
	private String idSequenceName;
	private String deleteSqlStatement;
	private ContributionsFieldSubset serverSupported;
	private ContributionsFieldSubset clientSide;
	
	public Contributions(Properties props, Connection connection) throws Exception {
		this.connection = connection;
		serverSupported = new ContributionServerSupportedFieldsImpl();
		clientSide = new ContributionClientSideFieldsImpl();

		readProperties(props);
	}

	private void readProperties(Properties props) throws Exception {
		tableName = props.getProperty(PROPERTIES_KEY_TABLE_NAME, DEFAULT_TABLE_NAME);
		idColumnName = props.getProperty(PROPERTIES_KEY_ID_COLUMN_NAME, DEFAULT_ID_COLUMN_NAME);
		idSequenceName = props.getProperty(PROPERTIES_KEY_ID_SEQUENCE_NAME, DEFAULT_ID_SEQUENCE_NAME);
		
		String serverFieldList = props.getProperty(PROPERTIES_KEY_SERVER_SUPPORTED_COLUMNS, DEFAULT_SERVER_SUPPORTED_COLUMNS);
		String clientFieldList = props.getProperty(PROPERTIES_KEY_CLIENT_SIDE_COLUMNS, DEFAULT_CLIENT_SIDE_COLUMNS);
		createServerSupportedAndClientSideLists(serverFieldList, clientFieldList);
		allFieldsInDb(serverFieldList, true); // verify all fields in prop lists accounted for in db - throw exception otherwise
		allFieldsInDb(clientFieldList, false);
		
		if (serverSupported.includes(idColumnName)) { // mark that column as auto incremented
			serverSupported.setAutoIncrementSequence(idColumnName, idSequenceName);
		} else {
			throw new Exception(idColumnName + " must be included in the serverSupported field list.");
		}
				
		deleteSqlStatement = "DELETE FROM \""+tableName+"\" WHERE \""+idColumnName+"\" = ?;";
	}
	
	private void createServerSupportedAndClientSideLists(String serverFieldList, String clientFieldList) throws Exception {
		String[] serverFields = serverFieldList.split(",");
		String[] clientFields = clientFieldList.split(",");
		
		String sqlQuery = null;
		{ // get full list of field names according to database schema
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.print("SELECT * FROM "+tableName+" LIMIT 1;");
			pw.flush();
			
			sqlQuery = sw.toString();
		}
		
		Statement stmt = connection.createStatement();
		if (stmt.execute(sqlQuery)) {
			ResultSet rs = stmt.getResultSet();
			ResultSetMetaData rsmd = rs.getMetaData();
			
			int count = rsmd.getColumnCount();
			for (int loop=0; loop<count; ++loop) {
				String columnName = rsmd.getColumnName(loop+1);
				boolean isServerSupported = isColumnNameInList(columnName, serverFields);
				boolean isClientSide = isColumnNameInList(columnName, clientFields);
				
				if (isServerSupported && isClientSide) { // huh? in both lists
					throw new Exception(columnName + " is included in both the serverSupported and clientSide contribution field lists.");
				} else if (isServerSupported) {
					serverSupported.addColumn(columnName, rsmd.getColumnType(loop+1), rsmd.getColumnTypeName(loop+1));
				} else if (isClientSide) {
					clientSide.addColumn(columnName, rsmd.getColumnType(loop+1), rsmd.getColumnTypeName(loop+1));
				} else { // huh? in neither list
					throw new Exception(columnName + " is NOT included in either the serverSupported or clientSide contribution field lists.");
				}
			}	
		}
	}
	
	private boolean isColumnNameInList(String columnName, String[] list) {
		boolean ret = false;
		for (String column : list) {
			if (column.equals(columnName)) {
				return(true);
			}
		}
		return(ret);
	}
	
	private void allFieldsInDb(String list, boolean checkServerSupported) throws Exception {
		String[] fieldNames = list.split(",");
		for (String field : fieldNames) {
			boolean exists = false;
			
			if (checkServerSupported && serverSupported.includes(field)) {
				exists = true;
			} else if (!checkServerSupported && clientSide.includes(field)) {
				exists = true;
			}
			if (!exists) {
				throw new Exception(field + " does not exist in the " + tableName + " schema.");
			}
		}
	}
	
	public void deleteContribution(String contributionId, String placeId) throws Exception {
		// Contribution id is an integer
		int id = Integer.parseInt(contributionId);
		
		PreparedStatement stmt = connection.prepareStatement(deleteSqlStatement);
		stmt.setInt(1, id);
//logger.info(stmt.toString());
		stmt.execute();
		
		contributionComet.reportDeletedContribution(placeId, contributionId);
	}

	public JSONObject fromName(String intPlaceId, UserRepository userRepository) throws Exception {
		String queryString = "SELECT " + serverSupported.getFieldNamesList();
		String clientFieldList = clientSide.getFieldNamesList();
		
		/*
		 * Assume there must be serverSupported fields but allow for no clientSide fields...
		 */
		if (clientFieldList != "") {
			queryString += "," + clientFieldList;
		}
		queryString += " FROM " + tableName + " WHERE place_id=?;";
		
		PreparedStatement stmt = connection.prepareStatement(queryString);
		serverSupported.writeToPreparedStatement(stmt, "place_id", 1, intPlaceId);
//logger.info(stmt.toString());
		JSONArray contributions = executeContribSelectToJson(stmt, userRepository);
		JSONObject result = new JSONObject();
		result.put("contributions", contributions);
		return(result);
	}
	
	private JSONArray executeContribSelectToJson(
			PreparedStatement pstmt,
			UserRepository userRepository) throws Exception {
		Map<Integer,JSONObject> userInfoMap = new HashMap<Integer,JSONObject>();

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
				for (int loop=0; loop<rsmd.getColumnCount(); ++loop) {
					int index = loop+1;

					String columnName = rsmd.getColumnName(index);

					if ("contributor_id".equalsIgnoreCase(columnName) ||
							"last_edit_id".equalsIgnoreCase(columnName)) {
						/*
						 * instead of inserting the id, swap in an object containing the 
						 * contributor information referenced by that id.
						 */

						JSONObject userInfo = null;
						int contributor_id = rs.getInt(index);
						Integer contId = new Integer(contributor_id);

						if (userInfoMap.containsKey(contId)) {
							userInfo = userInfoMap.get(contId);
						} else {
							try {
								userInfo = userRepository.userInfoFromId(contributor_id);
							} catch(Exception e) {
								// just ignore. User might be deleted from database
							}
							userInfoMap.put(contId, userInfo); // Cache result
						}

						if (null != userInfo) { // swap in contributor info - client side needs to be written to look for these...
							if ("contributor_id".equalsIgnoreCase(columnName)) {
								obj.put("contributor", userInfo);
							} else {
								obj.put("lastContributor", userInfo);								
							}
						}

					} else { // insert column after figuring out type info
						ColumnDataUtils.addColumnToJson(obj, rs, index, columnName, rsmd.getColumnType(index), rsmd.getColumnTypeName(index));
					}
				}
				array.put(obj);
				
			}
		} catch (Exception je) {
			throw new ServletException("Error while parsing results",je);
		}

		return(array);
	}

	public void insert(Map<String, List<String>> fieldPairs) throws Exception {
		String serverFields = serverSupported.getFieldNamesList();
		String clientFields = clientSide.getFieldNamesList();
		
		if (serverSupported.includes(idColumnName)) { // for insert - need to autoincrement id
			int aiValue = ColumnDataUtils.obtainNextIncrementInteger(
					connection,
					serverSupported.getColumnData(idColumnName));
			List<String> paramList = fieldPairs.get(idColumnName);
			if (null == paramList) {
				paramList = new Vector<String>();
				fieldPairs.put(idColumnName, paramList);
			}
			paramList.add("" + aiValue);
		} else {
			throw new Exception(idColumnName + " not included in serverSupported field list.");
		}
		
		String queryString = "INSERT INTO " + tableName + " (" + serverFields;
		if (clientFields != "") {
			queryString += "," + clientFields;
		}
		queryString += ") VALUES (";
		
		String[] eTokens = serverFields.split(",");
		String[] oTokens = clientFields.split(",");
		{
			boolean first = true;
			for (int i = 0; i < eTokens.length; i++) {
				if (first) {
					first = false;
				} else {
					queryString += ",";
				}
				queryString += serverSupported.getInsertWildcard(eTokens[i]);
			}
		}
		{
			for (int i = 0; i < oTokens.length; i++) {
				queryString += ",";
				queryString += clientSide.getInsertWildcard(oTokens[i]);
			}
		}
		queryString += ");";

		PreparedStatement stmt = connection.prepareStatement(queryString);
		int index = 1;  // reprocess all fields in the same order...
		{
			for (int i = 0; i < eTokens.length; i++) {
				serverSupported.addParameterToPreparedStatement(stmt, eTokens[i], index, fieldPairs);
				index++;
			}
		}
		{
			for (int i = 0; i < oTokens.length; i++) {
				clientSide.addParameterToPreparedStatement(stmt, oTokens[i], index, fieldPairs);
				index++;
			}
		}
//logger.info(stmt.toString());
		stmt.execute();
	}
		
	public void update(Map<String, List<String>> fieldPairs) throws Exception {
		String[] fullList_serverFields = serverSupported.getFieldNamesList().split(",");
		String[] fullList_clientFields = clientSide.getFieldNamesList().split(",");
		
		String serverFields = "";
		{
			String[] dontChange_serverSupported = { "id", "place_id", "contributor_id", "create_ts", "create_ms" };
			boolean first = true;
			for (int i=0; i<fullList_serverFields.length; i++) {
				if (!isColumnNameInList(fullList_serverFields[i], dontChange_serverSupported)) {
					if (fieldPairs.containsKey(fullList_serverFields[i])) {
						if (first) {
							first = false;
						} else {
							serverFields += ",";
						}
						serverFields += fullList_serverFields[i];
					}
				}
			}
		}
		
		String clientFields = "";
		{
			boolean first = true;
			for (int i=0; i<fullList_clientFields.length; i++) {
				if (fieldPairs.containsKey(fullList_clientFields[i])) {
					if (first) {
						first = false;
					} else {
						clientFields += ",";
					}
					clientFields += fullList_clientFields[i];
				}
			}
		}
		
		String queryString = "UPDATE " + tableName + " SET (" + serverFields;
		if (clientFields != "") {
			queryString += "," + clientFields;
		}
		queryString += ") = (";
		
		String[] eTokens = serverFields.split(",");
		String[] oTokens = clientFields.split(",");
		{
			boolean first = true;
			for (int i = 0; i < eTokens.length; i++) {
				if (first) {
					first = false;
				} else {
					queryString += ",";
				}
				queryString += serverSupported.getUpdateWildcard(eTokens[i]);
			}
		}
		{
			for (int i = 0; i < oTokens.length; i++) {
				queryString += ",";
				queryString += clientSide.getUpdateWildcard(oTokens[i]);
			}
		}
		queryString += ") WHERE id = " + serverSupported.getUpdateWildcard("id");
		queryString += " AND place_id = " + serverSupported.getUpdateWildcard("place_id") + ";";

		PreparedStatement stmt = connection.prepareStatement(queryString);
		int index = 1;  // reprocess all fields in the same order...
		{
			for (int i = 0; i < eTokens.length; i++) {
				serverSupported.addParameterToPreparedStatement(stmt, eTokens[i], index, fieldPairs);
				index++;
			}
		}
		{
			for (int i = 0; i < oTokens.length; i++) {
				clientSide.addParameterToPreparedStatement(stmt, oTokens[i], index, fieldPairs);
				index++;
			}
		}
		serverSupported.addParameterToPreparedStatement(stmt, "id", index, fieldPairs);
		index++;
		serverSupported.addParameterToPreparedStatement(stmt, "place_id", index, fieldPairs);
		
//logger.info(stmt.toString());
		stmt.execute();
	}
		
	public String getTableName() {
		return tableName;
	}

	public String getIdColumnName() {
		return idColumnName;
	}

	public ContributionComet getContributionComet() {
		return contributionComet;
	}

	public void setContributionComet(ContributionComet contributionComet) {
		this.contributionComet = contributionComet;
	}

}
