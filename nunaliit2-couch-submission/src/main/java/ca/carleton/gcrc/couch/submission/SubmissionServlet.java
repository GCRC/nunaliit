package ca.carleton.gcrc.couch.submission;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.Properties;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.json.JSONTokener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbSecurityDocument;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.client.CouchSession;
import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.impl.ConnectionStreamResult;
import ca.carleton.gcrc.couch.client.impl.CouchContextCookie;
import ca.carleton.gcrc.json.servlet.JsonServlet;
import ca.carleton.gcrc.utils.StreamUtils;
import ca.carleton.gcrc.couch.submission.SubmissionConstants;

@SuppressWarnings("serial")
public class SubmissionServlet extends JsonServlet {

	public static final String ConfigAttributeName_AtlasName = "SubmissionServlet_AtlasName";
	public static final String ConfigAttributeName_UserDb = "SubmissionServlet_UserDb";
	public static final String ConfigAttributeName_SubmissionDesign = "SubmissionServlet_SubmissionDesign";
	public static final String ConfigAttributeName_DocumentDesign = "SubmissionServlet_DocumentDesign";
	public static final String ConfigAttributeName_Submission_UnauthenticatedRecordsEndpointEnabled = "SubmissionServlet_Submission_UnauthenticatedRecordsEndpointEnabled";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String atlasName = null;
	private boolean isSubmissionUnauthenticatedRecordsEndpointEnabled = false;
	private CouchAuthenticationContext unauthenticatedRecordsUserAuthContext = null;
//	private CouchUserDb userDb = null;
	private CouchDesignDocument documentDesign = null;
	private CouchDesignDocument submissionDesign = null;
	private SubmissionServletActions actions = null;
	
	public SubmissionServlet(){
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		ServletContext context = config.getServletContext();
		
		logger.info(this.getClass().getSimpleName()+" servlet initialization - start");
		
		// AtlasName
		{
			Object obj = context.getAttribute(ConfigAttributeName_AtlasName);
			if( null == obj ){
				throw new ServletException("Atlas name is not specified ("+ConfigAttributeName_AtlasName+")");
			}
			if( obj instanceof String ){
				atlasName = (String)obj;
			} else {
				throw new ServletException("Unexpected object for atlas name: "+obj.getClass().getName());
			}
		}

		// Should the unauthenticated records endpoint be enabled?
		{
			Object obj = context.getAttribute(ConfigAttributeName_Submission_UnauthenticatedRecordsEndpointEnabled);
			if (null == obj) {
				// Not present, it defaults to false anyway
			}
			if (obj instanceof Boolean) {
				isSubmissionUnauthenticatedRecordsEndpointEnabled = (Boolean) obj;
			} else {
				throw new ServletException("Unexpected object for unauthenticated records endpoint configuration: "
						+ obj.getClass().getName());
			}

			if (isSubmissionUnauthenticatedRecordsEndpointEnabled) {
				Object userObj = context
						.getAttribute(SubmissionConstants.PROP_ATTR_SUBMISSION_UNAUTHENTICATED_RECORDS_USER);
				String couchDbUnauthEndpointUser = null;
				String couchDbUnauthEndpointUserPassword = null;
				String couchDbServerURL = null;
				if (null == userObj) {
					throw new ServletException(
							"CouchDB unauthenticated endpoint user not specified when unauthenticated endpoint is enabled");
				}
				if (userObj instanceof String) {
					couchDbUnauthEndpointUser = (String) userObj;
				} else {
					throw new ServletException("Unexpected object for CouchDB unauthenticated endpoint username: "
							+ userObj.getClass().getName());
				}

				Object passwordObj = context
						.getAttribute(SubmissionConstants.PROP_ATTR_SUBMISSION_UNAUTHENTICATED_RECORDS_USER_PASSWORD);
				if (null == passwordObj) {
					throw new ServletException(
							"CouchDB unauthenticated endpoint user's password not specified when unauthenticated endpoint is enabled");
				}
				if (passwordObj instanceof String) {
					couchDbUnauthEndpointUserPassword = (String) passwordObj;
				} else {
					throw new ServletException("Unexpected object for CouchDB unauthenticated endpoint user's password: "
							+ passwordObj.getClass().getName());
				}

				Object serverObj = context.getAttribute("couchdb.server");
				if (null == serverObj) {
					throw new ServletException(
							"CouchDB server URL not specified when unauthenticated endpoint is enabled");
				}
				if (serverObj instanceof String) {
					couchDbServerURL = (String) serverObj;
				} else {
					throw new ServletException("Unexpected object for CouchDB server URL: "
							+ serverObj.getClass().getName());
				}

				if (couchDbUnauthEndpointUser != null && couchDbUnauthEndpointUser.trim().length() > 0
				&& couchDbUnauthEndpointUserPassword != null && couchDbUnauthEndpointUserPassword.trim().length() > 0
				&& couchDbServerURL != null) {
					Properties properties = new Properties();
					properties.put("couchdb.server", couchDbServerURL);
					properties.put("couchdb.user", couchDbUnauthEndpointUser);
					properties.put("couchdb.password", couchDbUnauthEndpointUserPassword);
					
					CouchFactory factory = new CouchFactory();
					CouchClient client = null;
					CouchSession session = null;
					try {
						client = factory.getClient(properties);
					} catch (Exception e) {
						throw new ServletException(
								"Failed to get Couch client for unauthenticated records endpoint user");
					}
					try {
						client.validateContext();
					} catch (Exception e) {
						throw new ServletException(
								"Failed to validate unauthenticated records endpoint user authentication context (wrong credentials?)");
					}
					try {
						session = client.getSession();
					} catch (Exception e) {
						throw new ServletException(
								"Failed to get unauthenticated records endpoint user session");
					}
					try {
						unauthenticatedRecordsUserAuthContext = session.getAuthenticationContext();
					} catch (Exception e) {
						throw new ServletException("Failed to generate unauthenticated endpoint user authentication context.", e);
					}
				} else {
					throw new ServletException(
							"Failed to configure CouchDB unauthenticated endpoint user authentication context for unauthenticated endpoint");
				}
			}
		}
		
		// UserDb
		{
			Object obj = context.getAttribute(ConfigAttributeName_UserDb);
			if( null == obj ){
				throw new ServletException("User database is not specified ("+ConfigAttributeName_UserDb+")");
			}
			if( obj instanceof CouchUserDb ){
//				userDb = (CouchUserDb)obj;
			} else {
				throw new ServletException("Unexpected object for user database: "+obj.getClass().getName());
			}
		}

		// Document DB Design Document
		{
			Object obj = context.getAttribute(ConfigAttributeName_DocumentDesign);
			if( null == obj ){
				throw new ServletException("Document database is not specified ("+ConfigAttributeName_DocumentDesign+")");
			} else if( obj instanceof CouchDesignDocument ){
				documentDesign = (CouchDesignDocument)obj;
			} else {
				throw new ServletException("Unexpected object for document DB design document: "+obj.getClass().getName());
			}
		}

		// Submission Design Document
		{
			Object obj = context.getAttribute(ConfigAttributeName_SubmissionDesign);
			if( null == obj ){
				// That's OK. No submission DB
			} else if( obj instanceof CouchDesignDocument ){
				submissionDesign = (CouchDesignDocument)obj;
			} else {
				throw new ServletException("Unexpected object for submission design document: "+obj.getClass().getName());
			}
		}

		// Fix member roles on submission database
		try {
			if( null != submissionDesign ) {
				CouchDb submissionDb = submissionDesign.getDatabase();
				CouchDbSecurityDocument secDoc = submissionDb.getSecurityDocument();
				
				boolean updateRequired = false;
				
				// Administrator role
				{
					String adminRole = atlasName + "_administrator";
					if( false == secDoc.getAdminRoles().contains(adminRole) ) {
						secDoc.addAdminRole(adminRole);
						updateRequired = true;
					}
				}
				
				// Vetter role
				{
					String vetterRole = atlasName + "_vetter";
					if( false == secDoc.getMemberRoles().contains(vetterRole) ) {
						secDoc.addMemberRole(vetterRole);
						updateRequired = true;
					}
				}
				
				if( updateRequired ){
					submissionDb.setSecurityDocument(secDoc);
				}
			}
		} catch(Exception e) {
			throw new ServletException("Error while adjusting member roles on submission database", e);
		}
		
		actions = new SubmissionServletActions(atlasName, submissionDesign, documentDesign.getDatabase());

		logger.info(this.getClass().getSimpleName()+" servlet initialization - completed");
	}

	public void destroy() {
	}

	@Override
	protected void doGet(
		HttpServletRequest req
		,HttpServletResponse resp
		) throws ServletException, IOException {
		
// From: http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference
// GET /              - Returns MOTD and version
// GET /favicon.ico   - Special path for providing a site icon
// GET /_all_dbs      - Returns a list of all databases on this server
// GET /_active_tasks - Returns a list of running tasks
// GET /_uuids        - Returns a list of generated UUIDs
// GET /_stats        - Returns server statistics
// GET /_log          - Returns the tail of the server's log file, requires admin privileges
// GET /_sleep        - Returns success after waiting for a given number of milliseconds (removed since 1.0.0)
// GET /_utils/file   - Return static web pages that contain the CouchDB administration interface
		
// Custom:
// GET /_submission-info-by-device-id?key=?
//                     - Return _design/submission/_view/submission-info-by-device-id?key=?
// GET /_submission-info-by-id?key=?
//                     - Return _design/submission/_view/submission-info-by-id?key=?
		
		try {
			Cookie[] cookies = req.getCookies();
			CouchAuthenticationContext authContext = getAuthenticationContextFromCookies(cookies);
			
			List<String> path = computeRequestPath(req);
			
			String dbIdentifier = null;
			if( path.size() > 0 ){
				dbIdentifier = path.get(0);
			};
			
			if( path.size() < 1 ) {
				JSONObject result = actions.getWelcome();
				sendJsonResponse(resp, result);

			} else if( "_uuids".equals(dbIdentifier) ) {
				if( path.size() > 1 ){
					throw new Exception("Invalid _uuids request");
				}
				
				int count = 1;
				{
					String[] counts = req.getParameterValues("count");
					if( null != counts ) {
						if( counts.length > 1 ){
							throw new Exception("Parameter 'count' is specified multiple times");
						} else if( counts.length == 1 ) {
							count = Integer.parseInt(counts[0]);
						}
					}
				}
				
				JSONObject result = actions.getUuids(authContext, count);
				sendJsonResponse(resp, result);
				
			} else if( "_submission-info-by-device-id".equals(dbIdentifier) 
			        || "_submission-info-by-id".equals(dbIdentifier) ) {
				if( path.size() > 1 ){
					throw new Exception("Invalid "+dbIdentifier+" request");
				}
				
				String key = null;
				{
					String[] keys = req.getParameterValues("key");
					if( null == keys ) {
						throw new Exception("Parameter 'key' must be specified");
					} else {
						if( keys.length > 1 ){
							throw new Exception("Parameter 'key' is specified multiple times");
						} else if( keys.length < 1 ) {
							throw new Exception("Parameter 'key' must be specified");
						} else {
							key = keys[0];
						}
					}
				}

				ConnectionStreamResult result = null;
				if( "_submission-info-by-device-id".equals(dbIdentifier) ) {
					result = actions.getSubmissionInfoByDeviceId(authContext, key);
				} else if( "_submission-info-by-id".equals(dbIdentifier) ) {
					result = actions.getSubmissionInfoBySubmissionId(authContext, key);
				} else {
					throw new Exception("Do not know how to handle: "+dbIdentifier);
				}

				InputStream is = result.getInputStream();

				resp.setStatus(200);
				resp.setContentType(result.getContentType());
				resp.setCharacterEncoding(result.getContentEncoding());

				resp.addHeader("Cache-Control", "no-cache");
				resp.addHeader("Pragma", "no-cache");
				resp.addHeader("Expires", "-1");

				OutputStream os = resp.getOutputStream();
				
				StreamUtils.copyStream(is, os);
				
				os.flush();
				
			} else {
				throw new Exception("Invalid action requested");
			}
			
		} catch(Exception e) {
			reportError(e, resp);
		}
	}
	
	@Override
	protected void doPut(
			HttpServletRequest req
			,HttpServletResponse resp
			) throws ServletException, IOException {

// From: http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference
// PUT /_config/section/key              - Set a single configuration value in a given section to server configuration
// PUT /db                               - Create a new database
// PUT /db/_security                     - Sets the special security object for the database
// PUT /db/_revs_limit                   - Gets the limit of historical revisions to store for a single document in the database
// PUT /db/doc                           - Inserts a new version of the document
// PUT /db/doc/attachment                - Inserts an attachment to the document
// PUT /db/_local/local-doc              - Inserts a new version of the non-replicated document
// PUT /db/_design/design-doc            - Inserts a new version of the design document
// PUT /db/_design/design-doc/attachment - Inserts an attachment to the design document
		
		try {
			Cookie[] cookies = req.getCookies();
			CouchAuthenticationContext authContext = getAuthenticationContextFromCookies(cookies);
			
			List<String> path = computeRequestPath(req);
			
			String dbIdentifier = null;
			if( path.size() > 0 ){
				dbIdentifier = path.get(0);
			};
			
			if( "_config".equals(dbIdentifier) ){
				throw new Exception("setting configuration object is not supported");

			} else {
				String docId = null;
				if( path.size() > 1 ){
					docId = path.get(1);
				}
				if( "".equals(docId) && path.size() == 2 ){
					// Deals with terminating '/' on database creation
					docId = null;
					path.remove(1);
				}
				
				if( null == docId ) {
					// Database creation
					if( path.size() != 1 ){
						throw new Exception("invalid request to create database");
					}

					throw new Exception("creation database is not supported");

				} else if( docId.charAt(0) == '_' ){
					throw new Exception("creation of special document is not supported");
				
				} else {
					// Creation of a document or an attachment on a document
					String attName = null;
					if( path.size() > 2 ){
						attName = path.get(2);
					}
					if( path.size() > 3 ){
						throw new Exception("invalid request");
					}
					
					String deviceId = null;
					{
						String[] deviceIds = req.getParameterValues("deviceId");
						if( null != deviceIds ) {
							if( deviceIds.length > 1 ){
								throw new Exception("Parameter 'deviceId' is specified multiple times");
							} else if( deviceIds.length >0 ) {
								deviceId = deviceIds[0];
							}
						}
					}
					
					if( null != attName ){
						throw new Exception("creation of attachment is not supported");
					} else {
						// Create a document
						BufferedReader reader = req.getReader();
						JSONTokener tokener = new JSONTokener(reader);
						Object obj = tokener.nextValue();
						if( obj instanceof JSONObject ){
							JSONObject doc = (JSONObject)obj;
							JSONObject result = actions.modifyDocument(authContext, dbIdentifier, deviceId, docId, doc);
							sendJsonResponse(resp, result);

						} else {
							throw new Exception("On document creation, a JSON object is expected as content");
						}
					}
				}
			}
			
		} catch(Exception e) {
			reportError(e, resp);
		}
	}

	@Override
	protected void doPost(
			HttpServletRequest req,
			HttpServletResponse resp)
			throws ServletException, IOException {
		if (!isSubmissionUnauthenticatedRecordsEndpointEnabled) {
			resp.setStatus(404);
		}
		else {
			try {
				List<String> path = computeRequestPath(req);
				if (path.size() == 1 && path.get(0).equals("unauthenticatedRecords")) {
					BufferedReader reader = req.getReader();
					JSONTokener tokener = new JSONTokener(reader);
					Object obj = tokener.nextValue();
					if (obj instanceof JSONObject) {
						JSONObject doc = (JSONObject) obj;
						JSONObject result = actions.createUnauthenticatedDocument(
							unauthenticatedRecordsUserAuthContext,
							doc
						);
						sendJsonResponse(resp, result);
					} else {
						throw new Exception("On document creation, a JSON object is expected as content");
					}
				} else {
					throw new Exception("Invalid action requested");
				}
			} catch (Exception e) {
				reportError(e, resp);
			}
		}
	}
	
	@Override
	protected void doDelete(
			HttpServletRequest req
			,HttpServletResponse resp
			) throws ServletException, IOException {
// From: http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference
// DELETE /_config/section/key - Delete a single configuration value from a given section in server configuration
// DELETE /_session - Logout cookie based user
// DELETE /db - Delete an existing database
// DELETE /db/doc - Deletes the document
// DELETE /db/doc/attachment - Deletes an attachment from the document
// DELETE /db/_local/local-doc - Deletes the non-replicated document
// DELETE /db/_design/design-doc - Deletes the design document
// DELETE /db/_design/design-doc/attachment - Deletes an attachment from the design document
		
		try {
			Cookie[] cookies = req.getCookies();
			CouchAuthenticationContext authContext = getAuthenticationContextFromCookies(cookies);
			
			List<String> path = computeRequestPath(req);
			
			String dbIdentifier = null;
			if( path.size() > 0 ){
				dbIdentifier = path.get(0);
			};
			
			if( null == dbIdentifier ){
				throw new Exception("a database must be specified");

			} else if( "_config".equals(dbIdentifier) ){
				throw new Exception("setting configuration object is not supported");

			} else if( "_session".equals(dbIdentifier) ){
					throw new Exception("session object is not supported");

			} else {
				String docId = null;
				if( path.size() > 1 ){
					docId = path.get(1);
				}
				if( "".equals(docId) && path.size() == 2 ){
					// Deals with terminating '/' on database deletion
					docId = null;
					path.remove(1);
				}
				
				if( null == docId ) {
					// Database deletion
					if( path.size() != 1 ){
						throw new Exception("invalid request to delete database");
					}

					throw new Exception("database deletion is not supported");

				} else if( docId.charAt(0) == '_' ){
					throw new Exception("deletion of special document is not supported");
				
				} else {
					// Deletion of a document or an attachment on a document
					String attName = null;
					if( path.size() > 2 ){
						attName = path.get(2);
					}
					if( path.size() > 3 ){
						throw new Exception("invalid request");
					}
					
					if( null != attName ){
						throw new Exception("deletion of attachment is not supported");
					} else {
						// Delete a document
						
						String deviceId = null;
						{
							String[] deviceIds = req.getParameterValues("deviceId");
							if( null != deviceIds ) {
								if( deviceIds.length > 1 ){
									throw new Exception("Parameter 'deviceId' is specified multiple times");
								} else if( deviceIds.length >0 ) {
									deviceId = deviceIds[0];
								}
							}
						}
						
						String rev = getParameter(req, "rev");
						if( null == rev ){
							throw new Exception("Parameter 'rev' must be specified");
						}
						
						JSONObject result = actions.deleteDocument(authContext, dbIdentifier, deviceId, docId, rev);
						sendJsonResponse(resp, result);
					}
				}
			}
			
		} catch(Exception e) {
			reportError(e, resp);
		}
	}

	private CouchAuthenticationContext getAuthenticationContextFromCookies(Cookie[] cookies) throws Exception {
		CouchContextCookie contextCookie = new CouchContextCookie();
		if( null != cookies ) {
			for(Cookie cookie : cookies){
				contextCookie.setCookie(cookie.getName(), cookie.getValue());
			}
		}
		
		CouchClient client = documentDesign.getDatabase().getClient();
		
		CouchFactory factory = new CouchFactory();
		CouchClient userClient = factory.getClient(contextCookie, client);
		
		CouchSession session = userClient.getSession();
		CouchAuthenticationContext authContext = session.getAuthenticationContext();
		
		return authContext;
	}
	
	private String getParameter(HttpServletRequest req, String paramName) throws Exception {
		String[] params = req.getParameterValues(paramName);
		if( null != params ) {
			if( params.length > 1 ){
				throw new Exception("Parameter '"+paramName+"' is specified multiple times");
			} else if( params.length == 1 ) {
				return params[0];
			}
		}
		
		return null;
	}
}
