package ca.carleton.gcrc.couch.client;

import java.io.File;
import java.io.StringWriter;
import java.net.URL;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.app.JSONFileLoader;
import ca.carleton.gcrc.couch.app.JSONFileLoaderTest;

import junit.framework.TestCase;

public class CouchDesignDocumentTest extends TestCase {

	static final public String TEST_DD_NAME = "test";
	
	static boolean g_testDdCreated = false;
	static CouchDesignDocument g_testDd = null;
	
	static public CouchDesignDocument getTestDesignDocument() throws Exception {
		if( false == g_testDdCreated ) {
			CouchDb db = TestSupport.getTestCouchDb();
			if( null != db ) {
				if( false == db.documentExists("_design/"+TEST_DD_NAME) ) {
					URL url = JSONFileLoaderTest.class.getClassLoader().getResource("testDesignDoc");
					File dir = new File(url.getPath());

					// Load JSON string from directory structure
					JSONFileLoader builder = new JSONFileLoader(dir);
					StringWriter sw = new StringWriter();
					builder.write(sw);
					
					// Get JSON from it
					JSONObject jsonObj = null;
					{
						JSONTokener jsonTokener = new JSONTokener(sw.toString());
						Object obj = jsonTokener.nextValue();
						if( obj instanceof JSONObject ) {
							jsonObj = (JSONObject)obj;
						} else {
							throw new Exception("Unexpected returned object type: "+obj.getClass().getSimpleName());
						}
					}
					
					// Assign id
					jsonObj.put("_id", "_design/"+TEST_DD_NAME);
					
					// Create
					db.createDocument(jsonObj);
				}
				g_testDd = db.getDesignDocument(TEST_DD_NAME);
			}
			
			g_testDdCreated = true;
		}
		return g_testDd;
	}
	
	public void testQuery() throws Exception {
		CouchDesignDocument dd = getTestDesignDocument();
		if( null != dd ) {
			CouchDb db = dd.getDatabase();
			
			String type = "testQuery";
			
			// Insert object that should be found in query
			String expectedId = null;
			{
				JSONObject expectedDoc = new JSONObject();
				expectedDoc.put("type", type);
				db.createDocument(expectedDoc);
				expectedId = expectedDoc.getString("_id");
			}
			
			// Insert object that should not be found in query
			String unexpectedId = null;
			{
				JSONObject unexpectedDoc = new JSONObject();
				unexpectedDoc.put("name", type);
				db.createDocument(unexpectedDoc);
				unexpectedId = unexpectedDoc.getString("_id");
			}
			
			// Perform query
			CouchQuery query = new CouchQuery();
			query.setViewName("type");
			query.setStartKey(type);
			query.setEndKey(type);
			CouchQueryResults response = dd.performQuery(query);
			
			// Verify that we find what we expect
			boolean expectedFound = false;
			boolean unexpectedFound = false;
			for(JSONObject row : response.getRows()) {
				if( expectedId.equals(row.get("id")) ) {
					expectedFound = true;
				}
				if( unexpectedId.equals(row.get("id")) ) {
					unexpectedFound = true;
				}
			}
			if( false == expectedFound ) {
				fail("Did not find expected document from query");
			}
			if( true == unexpectedFound ) {
				fail("Found unexpected document from query");
			}
		}
	}

	public void testQueryValues() throws Exception {
		CouchDesignDocument dd = getTestDesignDocument();
		if( null != dd ) {
			CouchDb db = dd.getDatabase();
			
			String type = "testQueryValues";
			
			// Insert object that should be found in query
			String docId = null;
			{
				JSONObject doc = new JSONObject();
				doc.put("type", type);
				db.createDocument(doc);
				docId = doc.getString("_id");
			}
			
			// Perform query
			CouchQuery query = new CouchQuery();
			query.setViewName("type");
			query.setStartKey(type);
			query.setEndKey(type);
			CouchQueryResults response = dd.performQuery(query);
			
			// Verify that we find what we expect
			boolean expectedFound = false;
			for(JSONObject doc : response.getValues()) {
				if( docId.equals(doc.get("_id")) ) {
					expectedFound = true;
				}
			}
			if( false == expectedFound ) {
				fail("Did not find expected document from query");
			}
		}
	}

	public void testQueryWithSpecialKey() throws Exception {
		CouchDesignDocument dd = getTestDesignDocument();
		if( null != dd ) {
			CouchDb db = dd.getDatabase();
			
			String type = "testQueryWith\"SpecialKey";
			
			// Insert object that should be found in query
			String docId = null;
			{
				JSONObject doc = new JSONObject();
				doc.put("type", type);
				db.createDocument(doc);
				docId = doc.getString("_id");
			}
			
			// Perform query
			CouchQuery query = new CouchQuery();
			query.setViewName("type");
			query.setStartKey(type);
			query.setEndKey(type);
			CouchQueryResults response = dd.performQuery(query);
			
			// Verify that we find what we expect
			boolean expectedFound = false;
			for(JSONObject row : response.getRows()) {
				if( docId.equals(row.get("id")) ) {
					expectedFound = true;
				}
			}
			if( false == expectedFound ) {
				fail("Did not find expected document from query");
			}
		}
	}
}
