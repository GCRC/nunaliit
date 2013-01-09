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
package ca.carleton.gcrc.search;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.util.Date;
import java.util.Properties;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.jdbc.JdbcConnections;

@SuppressWarnings("serial")
public class SearchServlet extends HttpServlet {
	final static public String PROPERTIES_SERVLET_ATTRIB_NAME = "SearchConfigurationProperties";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private JdbcConnections connections = null;
	Connection connection = null;
	Searches searches = null;
	
	public SearchServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		ServletContext servletContext = config.getServletContext();

		try {
			connections = JdbcConnections.connectionsFromServletContext(servletContext);
			connection = connections.getDb();
		} catch (Exception e) {
			throw new ServletException("Error while connecting to database",e);
		}
		
		// Load up configuration information
		Properties props = new Properties();
		{
			if( null != servletContext ) {
				Object propertiesObj = servletContext.getAttribute(PROPERTIES_SERVLET_ATTRIB_NAME);
				if( null != propertiesObj
				 && propertiesObj instanceof Properties ) {
					props = (Properties)propertiesObj;
				}
			}
		}
		
		searches = new Searches(props,connection);
	}

	public void destroy() {
		connections.closeAllConnections();
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		
		logger.info(this.getClass().getName()+" "+path);

		try {
			if( "findGeometryCentroid".equalsIgnoreCase(path) ) {
				performFindGeometryCentroid(request, response);

			} else if( "searchContributions".equalsIgnoreCase(path) ) {
				performSearchContributions(request, response);

			} else if( "searchFeatures".equalsIgnoreCase(path) ) {
				performSearchFeatures(request, response);
					
			} else if( "getHoverMedia".equalsIgnoreCase(path) ) {
				performHoverMedia(request, response);
				
			} else if( "getAudioMedia".equalsIgnoreCase(path) ) {
				performGetAudioMedia(request, response);
					
			} else {
				throw new Exception("Unknown request: "+path);
			}
		} catch(Exception e) {
			sendErrorResponse(response, e);
			logger.error("Error while performing search",e);
		}
	}
	
	protected void performFindGeometryCentroid(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] ids = request.getParameterValues("id");
		String[] types = request.getParameterValues("type");
		
		if( null == ids || ids.length < 1 ) {
			throw new Exception("Parameter 'id' not provided");
		}
		if( ids.length > 1 ) {
			throw new Exception("Parameter 'id' provided multiple times");
		}
		
		if( null == types || types.length < 1 ) {
			throw new Exception("Parameter 'type' not provided");
		}
		if( types.length > 1 ) {
			throw new Exception("Parameter 'type' provided multiple times");
		}
		
		logger.info("findGeometry type:"+types[0]+" id:"+ids[0]);
		
		JSONObject result = null;
		if( "id".equalsIgnoreCase(types[0]) ) {
			result = searches.findGeometryCentroidFromId(ids[0]);
			
		} else if( "place_id".equalsIgnoreCase(types[0]) ) {
			result = searches.findGeometryCentroidFromPlace(ids[0]);
			
		} else {
			throw new Exception("Unknown type specified: "+types[0]);
		}
		
		sendJsonResponse(response, result);
	}
	
	protected void performSearchContributions(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] contents = request.getParameterValues("content");
		
		if( null == contents || contents.length < 1 ) {
			throw new Exception("Parameter 'content' not provided");
		}
		if( contents.length > 1 ) {
			throw new Exception("Parameter 'content' provided multiple times");
		}
		
		logger.info("searchContributions content:"+contents[0]);
		
		JSONObject result = searches.searchContributionsFromContent(contents[0]);
		
		sendJsonResponse(response, result);
	}
	
	protected void performSearchFeatures(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] contents = request.getParameterValues("content");
		
		if( null == contents || contents.length < 1 ) {
			throw new Exception("Parameter 'content' not provided");
		}
		if( contents.length > 1 ) {
			throw new Exception("Parameter 'content' provided multiple times");
		}
		
		logger.info("searchFeatures content:"+contents[0]);
		
		JSONObject result = searches.searchFeaturesFromContent(contents[0]);
		
		sendJsonResponse(response, result);
	}
	
	protected void performHoverMedia(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] ids = request.getParameterValues("id");
		
		if( null == ids || ids.length < 1 ) {
			throw new Exception("Parameter 'id' not provided");
		}
		if( ids.length > 1 ) {
			throw new Exception("Parameter 'id' provided multiple times");
		}
		
		logger.info("getHoverMedia id:"+ids[0]);
		
		JSONObject result = searches.findHoverMedia(ids[0]);
		
		sendJsonResponse(response, result);
	}
	
	protected void performGetAudioMedia(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] ids = request.getParameterValues("id");
		
		if( null == ids || ids.length < 1 ) {
			throw new Exception("Parameter 'id' not provided");
		}
		if( ids.length > 1 ) {
			throw new Exception("Parameter 'id' provided multiple times");
		}
		
		logger.info("getAudioMedia id:"+ids[0]);
		
		JSONObject result = searches.getAudioMediaFromPlaceId(ids[0]);
		
		sendJsonResponse(response, result);
	}
	
	protected void sendJsonResponse(HttpServletResponse response, JSONObject result) throws ServletException {

		response.setStatus(HttpServletResponse.SC_OK);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");
		
		try {
			OutputStreamWriter osw = new OutputStreamWriter( response.getOutputStream(), "UTF-8" );
			result.write(osw);
			osw.flush();
		} catch(Exception e) {
			throw new ServletException("Failure generating error",e);
		}
	}
	
	protected void sendErrorResponse(HttpServletResponse response, Throwable error) throws ServletException {

		response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");

		try {
			JSONObject result = new JSONObject();
			result.put("error", errorToJson(error));
			
			OutputStreamWriter osw = new OutputStreamWriter( response.getOutputStream(), "UTF-8" );
			result.write(osw);
			osw.flush();
		} catch(Exception e) {
			throw new ServletException("Failure generating error",e);
		}
	}
	
	protected JSONObject errorToJson(Throwable error) throws Exception {

		JSONObject errorObj = new JSONObject();
		errorObj.put("message", error.getMessage());
		if( null != error.getCause() ) {
			errorObj.put("cause", errorToJson(error.getCause()));
		}
		return errorObj;
	}
}
