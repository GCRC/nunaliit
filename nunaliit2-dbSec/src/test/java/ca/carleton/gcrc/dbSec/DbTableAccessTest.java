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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import junit.framework.TestCase;

public class DbTableAccessTest extends TestCase {

	static public _Conf conf = _Conf.getConfiguration();
	
	public void testInsert() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);
			DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
			
			// Insert
			{
				Map<String,String> params = new HashMap<String,String>();
				params.put("feature_id", "1");
				params.put("name", "testInsert");
				JSONObject jsonObj = dbTableAccess.insert(params);
				
				if( null == jsonObj ) {
					fail("Null was returned from insertion");
				}
				
				// Check values returned in insert
				{
					int featureId = jsonObj.getInt("feature_id");
					if( 1 != featureId ) {
						fail("Unexpected value in feature_id");
					}
	
					String name = jsonObj.getString("name");
					if( false == "testInsert".equals(name) ) {
						fail("Unexpected value in name");
					}
				}
			}
			
			// Check objects returned in a Query
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testInsert") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				// Verify results
				if( null == jsonArray ) {
					fail("Null was returned from query");
				} else {
					if( 1 != jsonArray.length() ) {
						fail("Invalid size");
					} else {
						JSONObject jsonObj = jsonArray.getJSONObject(0);
						
						int featureId = jsonObj.getInt("feature_id");
						if( 1 != featureId ) {
							fail("Unexpected value in feature_id after query");
						}

						String name = jsonObj.getString("name");
						if( false == "testInsert".equals(name) ) {
							fail("Unexpected value in name after query");
						}
					}
				}
			}
		}
	}
	
	public void testUpdate() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);
			DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());

			// Insert
			{
				Map<String,String> params = new HashMap<String,String>();
				params.put("feature_id", "2");
				params.put("name", "testUpdate");
				params.put("creator_id", "0");
				dbTableAccess.insert(params);
			}

			// Update
			JSONArray jsonArray = null;
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testUpdate") );
				Map<String,String> params = new HashMap<String,String>();
				params.put("creator_id", "1");
				jsonArray = dbTableAccess.update(selectors,params);
			}
			
			// Verify results
			if( null == jsonArray ) {
				fail("Null was returned from update");
			} else {
				if( 1 != jsonArray.length() ) {
					fail("Invalid size");
				} else {
					JSONObject obj = jsonArray.getJSONObject(0);
					
					int creatorId = obj.getInt("creator_id");
					if( 1 != creatorId ) {
						fail("Value was not updated");
					}
				}
			}
	
			// Query
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testUpdate") );
				jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
			}
			
			// Verify results
			if( null == jsonArray ) {
				fail("Null was returned from query");
			} else {
				if( 1 != jsonArray.length() ) {
					fail("Invalid size");
				} else {
					JSONObject obj = jsonArray.getJSONObject(0);
					
					int creatorId = obj.getInt("creator_id");
					if( 1 != creatorId ) {
						fail("Value was not updated");
					}
				}
			}
		}
	}
	
	public void testDelete() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);
			DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());

			// Insert
			{
				Map<String,String> params = new HashMap<String,String>();
				params.put("feature_id", "3");
				params.put("name", "testDelete");
				dbTableAccess.insert(params);
			}

			// Delete
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testDelete") );
				dbTableAccess.delete(selectors);
			}
			
			// Verify query
			JSONArray jsonArray = null;
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testDelete") );
				jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
			}
			
			// Verify results
			if( null == jsonArray ) {
				fail("Null was returned from query");
			} else {
				if( 0 != jsonArray.length() ) {
					fail("Object was not deleted");
				}
			}
		}
	}

	public void testAssignOnInsert() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);
			DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());

			// Insert
			{
				Map<String,String> params = new HashMap<String,String>();
				params.put("feature_id", "5");
				params.put("name", "testAssignOnInsert");
				dbTableAccess.insert(params);
			}

			// Verify that assignment was performed
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testAssignOnInsert") );
				JSONArray queriedObjs = dbTableAccess.query(selectors,null,null,null,null,null);
				if( 1 != queriedObjs.length() ) {
					fail("Array returned should have only one object");
				} else {
					JSONObject obj = queriedObjs.getJSONObject(0);
					
					int assignedValue = obj.getInt("feature_type_id");
					if( 1 != assignedValue ) {
						fail("Assigned value is not as expected: "+assignedValue);
					}
				}
			}
		}
	}

	public void testRowSelector() throws Exception {
		// This test inserts data in the underlying table (physical) using one
		// logical table. It then queries the same underlying table with a logical
		// view that segregates some of the rows via selectors installed in dbSec
		// (selectValue).
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);
			
			// Insert data
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());

				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "6");
					params.put("name", "testRowSelector");
					params.put("creator_id", "1");
					dbTableAccess.insert(params);
				}

				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "7");
					params.put("name", "testRowSelector");
					params.put("creator_id", "2");
					dbTableAccess.insert(params);
				}
			}
			
			// Query via a view that shows only creator_id=1
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "creator1", conf.getAnonymousUser());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testRowSelector") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				// Verify results
				if( null == jsonArray ) {
					fail("Null was returned from query");
				} else {
					if( 1 != jsonArray.length() ) {
						fail("Invalid size");
					} else {
						JSONObject jsonObj = jsonArray.getJSONObject(0);
						
						int creatorId = jsonObj.getInt("creator_id");
						if( 1 != creatorId ) {
							fail("Unexpected value in feature_id after query");
						}
					}
				}
			}
		}
	}
	
	public void testAssignVariableOnInsert() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);
			DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "userId", conf.getAdminUser());

			// Insert
			{
				Map<String,String> params = new HashMap<String,String>();
				params.put("feature_id", "8");
				params.put("name", "testAssignVariableOnInsert");
				dbTableAccess.insert(params);
			}

			// Verify that assignment was performed
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testAssignVariableOnInsert") );
				JSONArray queriedObjs = dbTableAccess.query(selectors,null,null,null,null,null);
				if( 1 != queriedObjs.length() ) {
					fail("Array returned should have only one object");
				} else {
					JSONObject obj = queriedObjs.getJSONObject(0);
					
					int assignedValue = obj.getInt("creator_id");
					if( _Conf.ADMIN_USERID != assignedValue ) {
						fail("Assigned value is not as expected: "+assignedValue);
					}
				}
			}
		}
	}
	
	public void testSelectOnUpdate() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);

			// Insert values in underlying table
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "9");
					params.put("name", "testSelectOnUpdate");
					params.put("value", "aaa");
					params.put("creator_id", "100");
					dbTableAccess.insert(params);
				}
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "10");
					params.put("name", "testSelectOnUpdate");
					params.put("value", "aaa");
					params.put("creator_id", "1");
					dbTableAccess.insert(params);
				}
			}

			// Update records via table that selects only creator_id=1
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "record1", conf.getAdminUser());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnUpdate") );
				
				Map<String,String> params = new HashMap<String,String>();
				params.put("value", "bbb");

				dbTableAccess.update(selectors, params);
			}

			// Verify that view can see all records
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "record1", conf.getAdminUser());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnUpdate") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 2 != jsonArray.length() ) {
					fail("Query should return all records");
				}
			}
			
			// Verify that correct record was modified
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnUpdate") );
				selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"10") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Unexpected size return in query set");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( false == "bbb".equals( jsonObject.getString("value") ) ) {
						fail("Unexpected value in record that should be updated");
					}
				}
			}
			
			// Verify that hidden record was not modified
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnUpdate") );
				selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"9") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Unexpected size return in query set (unmodified)");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( false == "aaa".equals( jsonObject.getString("value") ) ) {
						fail("Unexpected value in record that should not have bene updated");
					}
				}
			}
		}
	}
	
	public void testSelectOnDelete() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);

			// Insert values in underlying table
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "11");
					params.put("name", "testSelectOnDelete");
					params.put("creator_id", "100");
					dbTableAccess.insert(params);
				}
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "12");
					params.put("name", "testSelectOnDelete");
					params.put("creator_id", "1");
					dbTableAccess.insert(params);
				}
			}

			// Delete records via table that selects only creator_id=1
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "record1", conf.getAdminUser());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnDelete") );

				dbTableAccess.delete(selectors);
			}

			// Verify that correct record was deleted
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "record1", conf.getAdminUser());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnDelete") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Query should return one record");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( false == "11".equals( jsonObject.getString("feature_id") ) ) {
						fail("Unexpected record was deleted");
					}
				}
			}
		}
	}
	
	public void testSelectOnQuery() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);

			// Insert values in underlying table
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "13");
					params.put("name", "testSelectOnQuery");
					params.put("creator_id", "100");
					dbTableAccess.insert(params);
				}
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "14");
					params.put("name", "testSelectOnQuery");
					params.put("creator_id", "1");
					dbTableAccess.insert(params);
				}
			}

			// Verify that correct record is queried
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "viewCreator1", conf.getAdminUser());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectOnQuery") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Query should return one record");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( false == "14".equals( jsonObject.getString("feature_id") ) ) {
						fail("Unexpected record was returned");
					}
				}
			}
		}
	}
	
	public void testSelectVariableOnUpdate() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);

			// Insert values in underlying table
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "owner1", conf.getRegularUser1());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "15");
					params.put("name", "testSelectVariableOnUpdate");
					params.put("value", "aaa");
					dbTableAccess.insert(params);
				}
			}
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "owner1", conf.getRegularUser2());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "16");
					params.put("name", "testSelectVariableOnUpdate");
					params.put("value", "bbb");
					dbTableAccess.insert(params);
				}
			}
			
			// Verify that creator_id columns were set correctly
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				{
					List<RecordSelector> selectors = new Vector<RecordSelector>();
					selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnUpdate") );
					selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"15") );
					JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
					if( 1 != jsonArray.length() ) {
						fail("Unexpected size return in query set");
					} else {
						JSONObject jsonObject = jsonArray.getJSONObject(0);
						
						// Verify that creator_id is set correctly
						String userIdString = conf.getRegularUser1().getVariable("id");
						Integer userId = Integer.parseInt(userIdString);
						if( userId.intValue() != jsonObject.getInt("creator_id") ) {
							fail("Unexpected value in record that should be updated");
						}
					}
				}
				{
					List<RecordSelector> selectors = new Vector<RecordSelector>();
					selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnUpdate") );
					selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"16") );
					JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
					if( 1 != jsonArray.length() ) {
						fail("Unexpected size return in query set");
					} else {
						JSONObject jsonObject = jsonArray.getJSONObject(0);
						
						// Verify that creator_id is set correctly
						String userIdString = conf.getRegularUser2().getVariable("id");
						Integer userId = Integer.parseInt(userIdString);
						if( userId.intValue() != jsonObject.getInt("creator_id") ) {
							fail("Unexpected value in record that should be updated");
						}
					}
				}
			}

			// Update records via table that selects only creator_id=user.id
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "owner1", conf.getRegularUser1());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnUpdate") );
				
				Map<String,String> params = new HashMap<String,String>();
				params.put("value", "ccc");

				dbTableAccess.update(selectors, params);
			}
			
			// Verify that correct record was modified
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnUpdate") );
				selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"15") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Unexpected size return in query set");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( false == "ccc".equals( jsonObject.getString("value") ) ) {
						fail("Unexpected value in record that should be updated");
					}
				}
			}
			
			// Verify that hidden record was not modified
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnUpdate") );
				selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"16") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Unexpected size return in query set (unmodified)");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( false == "bbb".equals( jsonObject.getString("value") ) ) {
						fail("Unexpected value in record that should not have bene updated");
					}
				}
			}
		}
	}
	
	public void testSelectVariableOnDelete() throws Exception {
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);

			// Insert values in underlying table
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "owner1", conf.getRegularUser1());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "17");
					params.put("name", "testSelectVariableOnDelete");
					dbTableAccess.insert(params);
				}
			}
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "owner1", conf.getRegularUser2());
				{
					Map<String,String> params = new HashMap<String,String>();
					params.put("feature_id", "18");
					params.put("name", "testSelectVariableOnDelete");
					dbTableAccess.insert(params);
				}
			}
			
			// Verify that creator_id columns were set correctly
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				{
					List<RecordSelector> selectors = new Vector<RecordSelector>();
					selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnDelete") );
					selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"17") );
					JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
					if( 1 != jsonArray.length() ) {
						fail("Unexpected size return in query set");
					} else {
						JSONObject jsonObject = jsonArray.getJSONObject(0);
						
						// Verify that creator_id is set correctly
						String userIdString = conf.getRegularUser1().getVariable("id");
						Integer userId = Integer.parseInt(userIdString);
						if( userId.intValue() != jsonObject.getInt("creator_id") ) {
							fail("Unexpected value in record that should be updated");
						}
					}
				}
				{
					List<RecordSelector> selectors = new Vector<RecordSelector>();
					selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnDelete") );
					selectors.add( new RecordSelectorComparison("feature_id",RecordSelectorComparison.Comparison.EQUAL,"18") );
					JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
					if( 1 != jsonArray.length() ) {
						fail("Unexpected size return in query set");
					} else {
						JSONObject jsonObject = jsonArray.getJSONObject(0);
						
						// Verify that creator_id is set correctly
						String userIdString = conf.getRegularUser2().getVariable("id");
						Integer userId = Integer.parseInt(userIdString);
						if( userId.intValue() != jsonObject.getInt("creator_id") ) {
							fail("Unexpected value in record that should be updated");
						}
					}
				}
			}

			// Delete records via table that selects only creator_id=user.id
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "owner1", conf.getRegularUser1());

				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnDelete") );
				
				dbTableAccess.delete(selectors);
			}
			
			// Verify that correct record was deleted
			{
				DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "f1", conf.getAdminUser());
				
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testSelectVariableOnDelete") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				
				if( 1 != jsonArray.length() ) {
					fail("Unexpected size return in query set");
				} else {
					JSONObject jsonObject = jsonArray.getJSONObject(0);
					
					// Verify that value was changed
					if( 18 != jsonObject.getInt("feature_id") ) {
						fail("Wrong record was deleted");
					}
				}
			}
		}
	}
	
	public void testMultiGroupSelect() throws Exception {
		// This test is designed to verify that the right table definition
		// is selected when a user with multiple group ids is attempting
		// to gain access. The table definition with the highest priority
		// should be selected
		if( conf.isPerformingTests() ) {
			Connection conn = conf.getTestConnection();
			DbSecurity dbSec = new DbSecurity(conn);

			// Insert values in underlying table
			DbTableAccess dbTableAccess = DbTableAccess.getAccess(dbSec, "multi", conf.getRegularUserMultiGroup());
			{
				Map<String,String> params = new HashMap<String,String>();
				params.put("feature_id", "18");
				params.put("name", "testMultiGroupSelect");
				dbTableAccess.insert(params);
			}

			// Get record
			{
				List<RecordSelector> selectors = new Vector<RecordSelector>();
				selectors.add( new RecordSelectorComparison("name",RecordSelectorComparison.Comparison.EQUAL,"testMultiGroupSelect") );
				JSONArray jsonArray = dbTableAccess.query(selectors,null,null,null,null,null);
				if( 1 != jsonArray.length() ) {
					fail("Unexpected size return in query set");
				}
			}
		}
	}
}
