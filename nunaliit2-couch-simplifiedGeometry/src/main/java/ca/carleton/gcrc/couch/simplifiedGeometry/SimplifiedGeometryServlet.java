package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.StringWriter;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.json.servlet.JsonServlet;

@SuppressWarnings("serial")
public class SimplifiedGeometryServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	private SimplifiedGeometryServletConfiguration configuration = null;
	private SimplifiedGeometryActions actions = null;
	
	public SimplifiedGeometryServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		// Pick up configuration
		Object configurationObj = 
				config.getServletContext().getAttribute(SimplifiedGeometryServletConfiguration.CONFIGURATION_KEY);
		if( null == configurationObj ) {
			throw new ServletException("Can not find configuration object");
		}
		if( configurationObj instanceof SimplifiedGeometryServletConfiguration ){
			configuration = (SimplifiedGeometryServletConfiguration)configurationObj;

			actions = new SimplifiedGeometryActions(
				configuration.getCouchDb()
			);
			
		} else {
			throw new ServletException("Invalid class for configuration: "+configurationObj.getClass().getName());
		}
	}
	
	public void destroy() {
	}

	@SuppressWarnings("unused")
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(request);
			
			if( paths.size() < 1 ) {
				JSONObject result = new JSONObject();
				result.put("ok", true);
				result.put("service", "simplifiedGeometry");
				sendJsonResponse(response, result);
				
			} else if( paths.size() == 1
			 && "getAttachment".equals(paths.get(0)) ) {
				// Parameter 'id'
				String[] ids = request.getParameterValues("id");
				if( null == ids || ids.length != 1 ){
					throw new Exception("Parameter 'id' must be specified exactly once");
				}
				String id = ids[0];
				
				// Parameter 'att'
				String[] atts = request.getParameterValues("att");
				if( null == atts || atts.length != 1 ){
					throw new Exception("Parameter 'att' must be specified exactly once");
				}
				String att = atts[0];
				
				SimplifiedGeometryRequest simplifiedGeometryRequest = 
						new SimplifiedGeometryRequest();
				simplifiedGeometryRequest.addRequest(id, att);

				// Parameter 'sizeLimit'
				{
					String[] sizeLimits = request.getParameterValues("sizeLimit");
					if( null != sizeLimits && sizeLimits.length != 1 ){
						throw new Exception("If parameter 'sizeLimit' is specified, it must be provided exactly once");
					}
					if( null != sizeLimits ){
						long sizeLimit = Long.parseLong( sizeLimits[0] );
						simplifiedGeometryRequest.setSizeLimit(sizeLimit);
					}
				}

				// Parameter 'timeLimit'
				{
					String[] timeLimits = request.getParameterValues("timeLimit");
					if( null != timeLimits && timeLimits.length != 1 ){
						throw new Exception("If parameter 'timeLimit' is specified, it must be provided exactly once");
					}
					if( null != timeLimits ){
						long timeLimit = Long.parseLong( timeLimits[0] );
						simplifiedGeometryRequest.setSizeLimit(timeLimit);
					}
				}
				
				if( true ){
					// Start response
					response.setStatus(200);
					response.setContentType("application/json");
					response.setCharacterEncoding("utf-8");
					response.addHeader("Cache-Control", "no-cache");
					response.addHeader("Pragma", "no-cache");
					response.addHeader("Expires", "-1");
					OutputStream os = response.getOutputStream();
					
					// Perform request
					actions.getAttachments(simplifiedGeometryRequest, os);
				} else {
					// Perform request
					JSONObject result = actions.getAttachments(simplifiedGeometryRequest);

					sendJsonResponse(response, result);
				}
				
			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, response);
		}
	}

	@SuppressWarnings("unused")
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(request);
			
			if( paths.size() < 1 ) {
				throw new Exception("Unrecognized request");
				
			} else if( paths.size() == 1
			 && "getAttachments".equals(paths.get(0)) ) {
				// Read body
				InputStream is = request.getInputStream();
				InputStreamReader isr = new InputStreamReader(is,"UTF-8");
				StringWriter sw = new StringWriter();
				
				int c = isr.read();
				while( c >= 0 ){
					sw.write(c);
					c = isr.read();
				}
				
				// Decode JSON request
				JSONTokener tokener = new JSONTokener( sw.toString() );
				Object obj = tokener.nextValue();
				JSONObject jsonRequest = (JSONObject)obj;
				JSONArray geometryRequests = jsonRequest.getJSONArray("geometryRequests");

				// Process attachment requests
				SimplifiedGeometryRequest simplifiedGeometryRequest = 
					new SimplifiedGeometryRequest();
				for(int i=0; i<geometryRequests.length(); ++i){
					JSONObject geomRequest = geometryRequests.getJSONObject(i);
					
					String id = geomRequest.getString("id");
					String attName = geomRequest.getString("attName");
					
					simplifiedGeometryRequest.addRequest(id, attName);
				}
				
				// Size limit option
				{
					long limit = jsonRequest.optLong("sizeLimit", -1);
					simplifiedGeometryRequest.setSizeLimit(limit);
				}
				
				// Time limit option
				{
					int limit = jsonRequest.optInt("timeLimit", -1);
					simplifiedGeometryRequest.setTimeLimit(limit);
				}

				if( true ){
					// Start response
					response.setStatus(200);
					response.setContentType("application/json");
					response.setCharacterEncoding("utf-8");
					response.addHeader("Cache-Control", "no-cache");
					response.addHeader("Pragma", "no-cache");
					response.addHeader("Expires", "-1");
					OutputStream os = response.getOutputStream();
					
					// Perform request
					actions.getAttachments(simplifiedGeometryRequest, os);
				} else {
					// Perform request
					JSONObject result = actions.getAttachments(simplifiedGeometryRequest);

					sendJsonResponse(response, result);
				}
				
			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, response);
		}
	}
	
	
}
