package ca.carleton.gcrc.json.servlet;

import java.io.OutputStreamWriter;
import java.util.List;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public abstract class JsonServlet extends HttpServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	protected void sendJsonResponse(HttpServletResponse resp, JSONObject result) throws Exception {
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

	protected void reportError(Throwable t, HttpServletResponse resp) throws ServletException {
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
