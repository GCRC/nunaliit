package ca.carleton.gcrc.pgSync;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.user.UserServlet;
import ca.carleton.gcrc.couch.user.UserServletActions;
import ca.carleton.gcrc.couch.user.db.UserRepository;
import ca.carleton.gcrc.couch.user.db.UserRepositoryCouchDb;
import ca.carleton.gcrc.json.servlet.JsonServlet;

@SuppressWarnings("serial")
public class PgSyncServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private PgSyncServletConfiguration configuration = null;
	private UserServletActions userServletActions = null;
	private PgSyncRobotThread robot = null;

	public PgSyncServlet() {

	}

	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		logger.info(this.getClass().getSimpleName() + " servlet initialization - start");

		// Pick up configuration
		ServletContext context = config.getServletContext();
		Object configurationObj = context.getAttribute(PgSyncServletConfiguration.CONFIGURATION_KEY);
		if (null == configurationObj) {
			throw new ServletException("Can not find configuration object");
		}
		if (configurationObj instanceof PgSyncServletConfiguration) {
			configuration = (PgSyncServletConfiguration) configurationObj;

			if (configuration.isPostgresEnabled()) {
				setupActionsAndRobot();
			} else {
				logger.info(this.getClass().getSimpleName() + " servlet not configured");
			}

		} else {
			throw new ServletException("Invalid class for configuration: " + configurationObj.getClass().getName());
		}

		CouchUserDb userDb = getAttributeFromConfig(context, UserServlet.ConfigAttributeName_UserDb, CouchUserDb.class);
		CouchDesignDocument userDesignDocument;
		try {
			userDesignDocument = userDb.getDesignDocument("nunaliit_user");
		} catch (Exception e) {
			throw new ServletException("Unable to create user design document.", e);
		}
		String atlasName = getAttributeFromConfig(context, UserServlet.ConfigAttributeName_AtlasName, String.class);
		UserRepository userRepository = new UserRepositoryCouchDb(userDb, userDesignDocument);
		CouchDb documentDb = getAttributeFromConfig(context, UserServlet.ConfigAttributeName_DocumentDb, CouchDb.class);
		userServletActions = new UserServletActions(atlasName, documentDb, userRepository, null);
		if(!configuration.isPostgresEnabled()) {
			logger.info(this.getClass().getSimpleName() + " servlet initialization - completed");
		}
	}

	private <T> T getAttributeFromConfig(ServletContext context, String attributeKey, Class<T> attributeType)
			throws ServletException {
		Object obj = context.getAttribute(attributeKey);
		if (null == obj) {
			throw new ServletException("Document database is not specified (" + attributeKey + ")");
		}
		try {
			return attributeType.cast(obj);
		} catch (ClassCastException e) {
			throw new ServletException("Unexpected object for document database: " + obj.getClass().getName());
		}
	}

	public void destroy() {
		if (null != robot) {
			PgSyncRobotThread thread = robot;
			robot = null;
			try {
				thread.shutdown();
				thread.join();
			} catch (Exception e) {
				// just ignore. We're shutting down
			}
		}
	}

	private void setupActionsAndRobot() throws ServletException {
		PgSyncActions actions;
		try {
			actions = new PgSyncActions(configuration.getPgConnectString(), configuration.getPostgresUser(),
					configuration.getPostgresPass(), configuration.getCouchDb(),
					configuration.getAtlasDesignDocument());
			actions.recreateBaseN2Tables();
		} catch (Exception e) {
			logger.error("Error setting up postgres DB", e);
			return;
		}

		try {
			robot = new PgSyncRobotThread(configuration.getCouchDb(), configuration.getAtlasDesignDocument(),
					actions);
			robot.start();
		} catch (Exception e) {
			throw new ServletException("Unable to start pg sync robot", e);
		}
	}

	private void reconnect() {
		destroy();
		try {
			setupActionsAndRobot();
		} catch (Exception e) {
			logger.error("Error attempting reconnect to postgres", e);
		}

	}

	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(req);

			if (paths.size() < 1) {
				doGetWelcome(req, resp);

			} else if (paths.size() == 1
					&& "getInfo".equals(paths.get(0))) {
				resp.setContentType("text/plain");
				resp.setCharacterEncoding("utf-8");
				OutputStream os = resp.getOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(os, "utf-8");
				PrintWriter pw = new PrintWriter(osw);

				// actions.getInfo(pw);

				pw.flush();

			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, resp);
		}
	}

	@Override
	protected void doPut(
			HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(req);
			if (paths.size() == 1 && "reload".equals(paths.get(0))) {
				Cookie[] cookies = req.getCookies();
				if (!userServletActions.isUserAdmin(cookies)) {
					resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
					return;
				}
				if (!configuration.isPostgresEnabled()) {
					resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Service not found");
					return;
				}
				robot.runSyncAllDocs(0L);
				JSONObject result = new JSONObject();
				result.put("ok", true);
				result.put("message", "pg sync started");
				sendJsonResponse(resp, result);
			}
		} catch (Exception e) {
			reportError(e, resp);
		}
	}

	private void doGetWelcome(HttpServletRequest request, HttpServletResponse resp) throws Exception {
		if (configuration.isPostgresEnabled()) {
			JSONObject result = new JSONObject();
			if (robot == null || !robot.getLastSyncSuccess()) {
				Cookie[] cookies = request.getCookies();
				if (!userServletActions.isUserAdmin(cookies)) {
					result.put("ok", false);
					result.put("service", "pgsync");
					result.put("error", "Error in syncing docs to postgres");
				} else {
					reconnect();
					result.put("ok", false);
					result.put("service", "pgsync");
					result.put("error", "Attempting reconnection to postgres");
				}
			} else {
				result.put("ok", true);
				result.put("service", "pg sync");
			}
			sendJsonResponse(resp, result);
		} else {
			JSONObject result = new JSONObject();
			result.put("ok", false);
			result.put("service", "pg sync");
			result.put("error", "service not available");
			resp.setStatus(404);
			resp.setContentType("application/json");
			resp.setCharacterEncoding("utf-8");
			resp.addHeader("Cache-Control", "no-cache");
			resp.addHeader("Pragma", "no-cache");
			resp.addHeader("Expires", "-1");
			OutputStreamWriter osw = new OutputStreamWriter(resp.getOutputStream(), "UTF-8");
			result.write(osw);
			osw.flush();
		}

	}

	protected List<String> computeRequestPath(HttpServletRequest req) throws Exception {
		List<String> paths = new Vector<String>();

		String path = req.getPathInfo();
		if (null != path) {
			boolean first = true;
			String[] pathFragments = path.split("/");
			for (String f : pathFragments) {
				if (first) {
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
