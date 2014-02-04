package ca.carleton.gcrc.couch.user;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbSecurityDocument;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.user.db.UserRepository;
import ca.carleton.gcrc.couch.user.db.UserRepositoryCouchDb;
import ca.carleton.gcrc.couch.user.error.TokenExpiredException;
import ca.carleton.gcrc.couch.user.error.UserUpdatedException;
import ca.carleton.gcrc.couch.user.mail.UserMailNotification;
import ca.carleton.gcrc.couch.user.mail.UserMailNotificationImpl;
import ca.carleton.gcrc.couch.user.mail.UserMailNotificationNull;
import ca.carleton.gcrc.mail.MailDelivery;

@SuppressWarnings("serial")
public class UserServlet extends HttpServlet {

	public static final String ConfigAttributeName_AtlasName = "UserServlet_AtlasName";
	public static final String ConfigAttributeName_UserDb = "UserServlet_UserDb";
	public static final String ConfigAttributeName_ServerKey = "UserServlet_ServerKey";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String atlasName = null;
	private CouchDb userDb = null;
	private byte[] serverKey = null;
	private UserServletActions actions = null;
	
	public UserServlet(){
		
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
		
		// Mail Delivery
		UserMailNotification userMailNotification = new UserMailNotificationNull();
		{
			Object obj = context.getAttribute(MailDelivery.ConfigAttributeName_MailDelivery);
			if( null == obj ){
				throw new ServletException("Mail delivery is not specified ("+MailDelivery.ConfigAttributeName_MailDelivery+")");
			}
			if( obj instanceof MailDelivery ){
				MailDelivery mailDelivery = (MailDelivery)obj;
				userMailNotification = new UserMailNotificationImpl(mailDelivery);
			} else {
				throw new ServletException("Unexpected object for mail delivery: "+obj.getClass().getName());
			}
		}
		
		// UserDb
		{
			Object obj = context.getAttribute(ConfigAttributeName_UserDb);
			if( null == obj ){
				throw new ServletException("User database is not specified ("+ConfigAttributeName_UserDb+")");
			}
			if( obj instanceof CouchDb ){
				userDb = (CouchDb)obj;
			} else {
				throw new ServletException("Unexpected object for user database: "+obj.getClass().getName());
			}
		}
		
		// Server Key
		{
			Object obj = context.getAttribute(ConfigAttributeName_ServerKey);
			if( null != obj ){
				if( obj instanceof ByteBuffer ){
					ByteBuffer serverKeyBuffer = (ByteBuffer)obj;
					serverKey = serverKeyBuffer.array();
				} else {
					throw new ServletException("Unexpected object for server key: "+obj.getClass().getName());
				}
			}
		}
		
		// Nunaliit user design document
		CouchDesignDocument userDesignDocument = null;
		if( null != userDb ){
			try {
				userDesignDocument = userDb.getDesignDocument("nunaliit_user");
			} catch (Exception e) {
				throw new ServletException("Unable to create user deisgn document.",e);
			}
		}
		
		UserRepository userRepository = new UserRepositoryCouchDb(userDb, userDesignDocument);
		
		actions = new UserServletActions(userRepository, userMailNotification);
		if( null != serverKey ){
			actions.setServerKey(serverKey);
		}
		
		// Add atlas role to access user database
		try {
			CouchDbSecurityDocument securityDoc = userDb.getSecurityDocument();
			Collection<String> adminRoles = securityDoc.getAdminRoles();
			
			boolean updateRequired = false;

			// <atlas>_administrator
			{
				String targetRole = atlasName + "_administrator";
				if( false == adminRoles.contains(targetRole) ) {
					securityDoc.addAdminRole(targetRole);
					updateRequired = true;
				}
			}

			// administrator
			{
				String targetRole = "administrator";
				if( false == adminRoles.contains(targetRole) ) {
					securityDoc.addAdminRole(targetRole);
					updateRequired = true;
				}
			}

			if( updateRequired ) {
				userDb.setSecurityDocument(securityDoc);
			}
		} catch(Exception e) {
			throw new ServletException("Error while updating security document on _users database",e);
		}

		logger.info(this.getClass().getSimpleName()+" servlet initialization - completed");
	}

	public void destroy() {
		
	}

	@Override
	protected void doGet(
		HttpServletRequest req
		,HttpServletResponse resp
		) throws ServletException, IOException {
		
		try {
			List<String> path = computeRequestPath(req);
			
//			{
//				StringWriter sw = new StringWriter();
//				sw.write("Path");
//				for(String f : path){
//					sw.write("-"+f);
//				}
//				logger.error(sw.toString());
//			}

//			{
//				Map<?,?> parameterMap = req.getParameterMap();
//				for(Object keyObj : parameterMap.keySet()){
//					if( keyObj instanceof String ){
//						String key = (String)keyObj;
//						
//						StringWriter sw = new StringWriter();
//						sw.write("Param "+key);
//	
//						Object valueObj = parameterMap.get(key);
//						if( valueObj instanceof String[] ){
//							String[] l = (String[])valueObj;
//							for(String param : l){
//								sw.write("-"+param);
//							}
//						}
//						
//						logger.error(sw.toString());
//					}
//				}
//			}
			
			if( path.size() < 1 ) {
				JSONObject result = actions.getWelcome();
				sendJsonResponse(resp, result);

			} else if( path.size() == 2 && path.get(0).equals("getUser") ) {
					JSONObject result = actions.getUser(path.get(1));
					sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("getUser") ) {
				String[] userStrings = req.getParameterValues("user");
				String[] emailStrings = req.getParameterValues("email");
				
				// Request by user name
				if( null != userStrings && userStrings.length > 0 ){
					String userName = userStrings[0];
					JSONObject result = actions.getUser(userName);
					sendJsonResponse(resp, result);
					
				} else if( null != emailStrings && emailStrings.length > 0 ){
					// Request by e-mail
					String emailAddress = emailStrings[0];
					JSONObject result = actions.getUserFromEmailAddress(emailAddress);
					sendJsonResponse(resp, result);
				}

			} else if( path.size() == 1 && path.get(0).equals("getUsers") ) {
				String[] userStrings = req.getParameterValues("user");
				
				List<String> users = new ArrayList<String>(userStrings.length);
				for(String userString : userStrings){
					users.add(userString);
				}
				
				JSONObject result = actions.getUsers(users);
				sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("initUserCreation") ) {
				String[] emailStrings = req.getParameterValues("email");

				if( null == emailStrings || emailStrings.length < 1 ){
					throw new Exception("'email' parameter must be specified");
				}
				if( emailStrings.length > 1 ){
					throw new Exception("'email' parameter must be specified exactly once");
				}
				
				JSONObject result = actions.initUserCreation(emailStrings[0]);
				sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("validateUserCreation") ) {
				String[] tokenStrings = req.getParameterValues("token");

				if( null == tokenStrings || tokenStrings.length < 1 ){
					throw new Exception("'token' parameter must be specified");
				}
				if( tokenStrings.length > 1 ){
					throw new Exception("'token' parameter must be specified exactly once");
				}
				
				JSONObject result = actions.validateUserCreation(tokenStrings[0]);
				sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("completeUserCreation") ) {

				// Token
				String token = null;
				{
					String[] tokenStrings = req.getParameterValues("token");
					if( null == tokenStrings || tokenStrings.length < 1 ){
						throw new Exception("'token' parameter must be specified");
					}
					if( tokenStrings.length > 1 ){
						throw new Exception("'token' parameter must be specified exactly once");
					}
					token = tokenStrings[0];
				}

				// Display Name
				String displayName = null;
				{
					String[] displayStrings = req.getParameterValues("display");
					if( null == displayStrings || displayStrings.length < 1 ){
						throw new Exception("'display' parameter must be specified");
					}
					if( displayStrings.length > 1 ){
						throw new Exception("'display' parameter must be specified exactly once");
					}
					displayName = displayStrings[0];
				}

				// Password
				String password = null;
				{
					String[] passwordStrings = req.getParameterValues("password");
					if( null == passwordStrings || passwordStrings.length < 1 ){
						throw new Exception("'password' parameter must be specified");
					}
					if( passwordStrings.length > 1 ){
						throw new Exception("'password' parameter must be specified exactly once");
					}
					password = passwordStrings[0];
				}
				
				// Email Password
				boolean emailPassword = false;
				{
					String[] emailPasswordStrings = req.getParameterValues("emailPassword");
					if( null != emailPasswordStrings ) {
						if( emailPasswordStrings.length > 1 ){
							throw new Exception("'emailPassword' parameter must not be specified more than once");
						}
						emailPassword = Boolean.parseBoolean( emailPasswordStrings[0] );
					}
				}
				
				JSONObject result = actions.completeUserCreation(token,displayName,password,emailPassword);
				sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("initPasswordRecovery") ) {
				String[] emailStrings = req.getParameterValues("email");

				if( null == emailStrings || emailStrings.length < 1 ){
					throw new Exception("'email' parameter must be specified");
				}
				if( emailStrings.length > 1 ){
					throw new Exception("'email' parameter must be specified exactly once");
				}
				
				JSONObject result = actions.initPasswordRecovery(emailStrings[0]);
				sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("validatePasswordRecovery") ) {
				String[] tokenStrings = req.getParameterValues("token");

				if( null == tokenStrings || tokenStrings.length < 1 ){
					throw new Exception("'token' parameter must be specified");
				}
				if( tokenStrings.length > 1 ){
					throw new Exception("'token' parameter must be specified exactly once");
				}
				
				JSONObject result = actions.validatePasswordRecovery(tokenStrings[0]);
				sendJsonResponse(resp, result);

			} else if( path.size() == 1 && path.get(0).equals("completePasswordRecovery") ) {

				// Token
				String token = null;
				{
					String[] tokenStrings = req.getParameterValues("token");
					if( null == tokenStrings || tokenStrings.length < 1 ){
						throw new Exception("'token' parameter must be specified");
					}
					if( tokenStrings.length > 1 ){
						throw new Exception("'token' parameter must be specified exactly once");
					}
					token = tokenStrings[0];
				}

				// Password
				String password = null;
				{
					String[] passwordStrings = req.getParameterValues("password");
					if( null == passwordStrings || passwordStrings.length < 1 ){
						throw new Exception("'password' parameter must be specified");
					}
					if( passwordStrings.length > 1 ){
						throw new Exception("'password' parameter must be specified exactly once");
					}
					password = passwordStrings[0];
				}
				
				// Email Password
				boolean emailPassword = false;
				{
					String[] emailPasswordStrings = req.getParameterValues("emailPassword");
					if( null != emailPasswordStrings ) {
						if( emailPasswordStrings.length > 1 ){
							throw new Exception("'emailPassword' parameter must not be specified more than once");
						}
						emailPassword = Boolean.parseBoolean( emailPasswordStrings[0] );
					}
				}
				
				JSONObject result = actions.completePasswordRecovery(token,password,emailPassword);
				sendJsonResponse(resp, result);

			} else {
				throw new Exception("Invalid action requested");
			}
			
		} catch(Exception e) {
			reportError(e, resp);
		}
	}
	
	@Override
	protected void doPost(
		HttpServletRequest req
		,HttpServletResponse resp
		) throws ServletException, IOException {

		try {
			throw new Exception("Invalid operation");
			
		} catch(Exception e) {
			reportError(e, resp);
		}
	}
	
	private void sendJsonResponse(HttpServletResponse resp, JSONObject result) throws Exception {
		if( null == result ) {
			resp.setStatus(304); // not modified
		} else {
			resp.setStatus(200);
		}
		resp.setContentType("application/json");
		resp.setCharacterEncoding("utf-8");
		resp.addHeader("Cache-Control", "no-cache");
		resp.addHeader("Pragma", "no-cache");
		resp.addHeader("Expires", "-1");
		
		if( null != result ) {
			OutputStreamWriter osw = new OutputStreamWriter(resp.getOutputStream(), "UTF-8");
			result.write(osw);
			osw.flush();
		}
		
	}

	private void reportError(Throwable t, HttpServletResponse resp) throws ServletException {
		try {
			resp.setStatus(400);
			resp.setContentType("application/json");
			resp.setCharacterEncoding("utf-8");
			resp.addHeader("Cache-Control", "must-revalidate");
			
			JSONObject errorObj = new JSONObject();
			errorObj.put("error", t.getMessage());
			
			int limit = 15;
			Throwable cause = t;
			while( null != cause && limit > 0 ){
				if( cause instanceof TokenExpiredException ){
					errorObj.put("tokenExpired", true);
				}
				if( cause instanceof UserUpdatedException ){
					errorObj.put("userUpdated", true);
				}
				
				--limit;
				cause = cause.getCause();
			}
			
			OutputStreamWriter osw = new OutputStreamWriter(resp.getOutputStream(), "UTF-8");
			errorObj.write(osw);
			osw.flush();
			
		} catch (Exception e) {
			logger.error("Unable to report error", e);
			throw new ServletException("Unable to report error", e);
		}
	}
	
	private List<String> computeRequestPath(HttpServletRequest req) throws Exception {
		List<String> paths = new Vector<String>();
		
		String path = req.getPathInfo();
		if( null != path ) {
			boolean first = true;
			String[] pathFragments = path.split("/");
			for(String f : pathFragments) {
				if( first ){
					// Skip first which is empty (/getUser/user1 -> "","getUser","user1")
					first = false;
				} else {
					paths.add(f);
				}
			}
		}
		
		return paths;
	}
}
