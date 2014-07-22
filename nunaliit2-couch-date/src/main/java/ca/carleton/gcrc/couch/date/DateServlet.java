package ca.carleton.gcrc.couch.date;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.date.impl.DateSource;
import ca.carleton.gcrc.couch.date.impl.DateSourceCouchWithCluster;
import ca.carleton.gcrc.json.servlet.JsonServlet;

@SuppressWarnings("serial")
public class DateServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private DateServletConfiguration configuration = null;
	private DateServiceActions actions = null;
	
	public DateServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		// Pick up configuration
		Object configurationObj = config.getServletContext().getAttribute(DateServletConfiguration.CONFIGURATION_KEY);
		if( null == configurationObj ) {
			throw new ServletException("Can not find configuration object");
		}
		if( configurationObj instanceof DateServletConfiguration ){
			configuration = (DateServletConfiguration)configurationObj;

			DateSource dateSource;
			try {
				dateSource = new DateSourceCouchWithCluster(configuration.getAtlasDesignDocument());
			} catch (Exception e) {
				throw new ServletException("Unable to create date source",e);
			}
			
			actions = new DateServiceActions(dateSource);
			
		} else {
			throw new ServletException("Invalid class for configuration: "+configurationObj.getClass().getName());
		}
	}
	
	public void destroy() {
		
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(request);
			
			if( paths.size() < 1 ) {
				doGetWelcome(request, response);
				
			} else if( paths.size() == 1
			 && "docIdsFromInterval".equals(paths.get(0)) ) {
				String[] mins = request.getParameterValues("min");
				if( null == mins || mins.length != 1 ){
					throw new Exception("Parameter 'min' must be specified exactly once");
				}
				String[] maxs = request.getParameterValues("max");
				if( null == maxs || maxs.length != 1 ){
					throw new Exception("Parameter 'max' must be specified exactly once");
				}
				
				long min = Long.parseLong(mins[0]);
				long max = Long.parseLong(maxs[0]);
				
				JSONObject result = actions.getDocIdsFromInterval(min, max);
				sendJsonResponse(response, result);
				
			} else if( paths.size() == 1
			 && "getInfo".equals(paths.get(0)) ) {
				response.setContentType("text/plain");
				response.setCharacterEncoding("utf-8");
				OutputStream os = response.getOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(os,"utf-8");
				PrintWriter pw = new PrintWriter(osw);
				
				actions.getInfo(pw);
				
				pw.flush();
				
			} else if( paths.size() == 1
			 && "getDot".equals(paths.get(0)) ) {
				response.setContentType("text/plain");
				response.setCharacterEncoding("utf-8");
				OutputStream os = response.getOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(os,"utf-8");
				PrintWriter pw = new PrintWriter(osw);
				
				actions.getDotInfo(pw);
				
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
		result.put("service", "date");
		sendJsonResponse(resp, result);
	}
}
