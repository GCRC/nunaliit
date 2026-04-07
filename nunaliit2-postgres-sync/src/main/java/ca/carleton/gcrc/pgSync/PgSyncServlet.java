package ca.carleton.gcrc.pgSync;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

// import java.io.File;
// import java.io.FileInputStream;
// import java.io.FileNotFoundException;
import java.io.IOException;
// import java.io.InputStream;
// import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
// import java.util.Date;
import java.util.List;
import java.util.Vector;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.postgres.PostgresPlugin;

// import javax.servlet.ServletConfig;
// import javax.servlet.ServletContext;
// import javax.servlet.ServletException;
// import javax.servlet.ServletOutputStream;
// import javax.servlet.http.HttpServletRequest;
// import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.json.servlet.JsonServlet;

@SuppressWarnings("serial")
public class PgSyncServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private PgSyncServletConfiguration configuration = null;
	private PgSyncActions actions = null;
	private PgSyncRobotThread robot = null;
	private Jdbi jdbi;
	
	public PgSyncServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		// Pick up configuration
		Object configurationObj = config.getServletContext().getAttribute(PgSyncServletConfiguration.CONFIGURATION_KEY);
		if( null == configurationObj ) {
			throw new ServletException("Can not find configuration object");
		}
		if( configurationObj instanceof PgSyncServletConfiguration ){
			configuration = (PgSyncServletConfiguration)configurationObj;

			jdbi = Jdbi.create(configuration.getPgConnectString(), configuration.getPostgresUser(), configuration.getPostgresPass())
				.installPlugin(new PostgresPlugin());

			jdbi.useHandle(handle -> {
				handle.execute("CREATE EXTENSION IF NOT EXISTS postgis;");
				handle.execute("DROP TABLE IF EXISTS n2doc;");
				handle.execute("CREATE TABLE n2doc (" + 
										"    id serial NOT NULL,\n" +
										"    nunaliit_id character varying(255) NOT NULL,\n" +
										"    nunaliit_rev character varying(255),\n" +
										"    nunaliit_schema character varying(255),\n" +
										"    nunaliit_values jsonb,\n" +
										"    nunaliit_geom geometry, \n" +
										"    PRIMARY KEY (id)\n" +
										");");
			});

			try {
				robot = new PgSyncRobotThread(configuration.getCouchDb(), configuration.getAtlasDesignDocument(), jdbi);
				robot.start();
			} catch (Exception e) {
				throw new ServletException("Unable to start pg sync robot",e);
			}
			
		} else {
			throw new ServletException("Invalid class for configuration: "+configurationObj.getClass().getName());
		}
	}
	
	public void destroy() {
		if( null != robot ){
			PgSyncRobotThread thread = robot;
			robot = null;
			try{
				thread.shutdown();
				thread.join();
			} catch(Exception e) {
				// just ignore. We're shutting down
			}
		}
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(request);
			
			if( paths.size() < 1 ) {
				doGetWelcome(request, response);
				
			} else if( paths.size() == 1
			 && "getInfo".equals(paths.get(0)) ) {
				response.setContentType("text/plain");
				response.setCharacterEncoding("utf-8");
				OutputStream os = response.getOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(os,"utf-8");
				PrintWriter pw = new PrintWriter(osw);
				
				// actions.getInfo(pw);
				
				pw.flush();
				
			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, response);
		}
	}

	private void doGetWelcome(HttpServletRequest request, HttpServletResponse resp) throws Exception {
		JSONObject result = new JSONObject();
		result.put("ok", true);
		result.put("service", "pg sync");
		sendJsonResponse(resp, result);
	}

	protected List<String> computeRequestPath(HttpServletRequest req) throws Exception {
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
