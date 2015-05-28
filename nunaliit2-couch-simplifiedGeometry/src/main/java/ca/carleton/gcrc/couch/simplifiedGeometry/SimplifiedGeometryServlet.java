package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
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
				
				Map<String,String> attNameByDocId = new HashMap<String,String>();
				attNameByDocId.put(id, att);
				
				JSONObject result = actions.getAttachments(attNameByDocId);
				sendJsonResponse(response, result);
				
			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, response);
		}
	}
}
