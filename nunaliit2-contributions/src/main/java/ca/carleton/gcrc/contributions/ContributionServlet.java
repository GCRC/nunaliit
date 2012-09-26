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
package ca.carleton.gcrc.contributions;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.util.Date;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.auth.common.UserRepository;
import ca.carleton.gcrc.auth.common.UserRepositorySingleton;
import ca.carleton.gcrc.jdbc.JdbcConnections;

public class ContributionServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private JdbcConnections connections = null;
	private Connection connection = null;
	private Contributions contributions;
	private UserRepository userRepository;
	
	public ContributionServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);

		try {
			connections = JdbcConnections.connectionsFromServletContext(config.getServletContext());
			connection = connections.getDb();
		} catch (Exception e) {
			throw new ServletException("Error while connecting to database",e);
		}
		
		userRepository = UserRepositorySingleton.getSingleton();
		
		contributions = ContributionsUtils.createContibutionHandler(config.getServletContext(), connection);
		if (null == contributions) {
			return;
		}
		
		try {
			ContributionComet contComet = new ContributionCometImpl(config.getServletContext());
			contributions.setContributionComet( contComet );
		} catch(Exception e) {
			logger.error("Comet not available for contributions", e);
		}
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
			if( "delete".equalsIgnoreCase(path) ) {
				performDelete(request, response);

			} else if( "fromName".equalsIgnoreCase(path) ) {
				performFromName(request, response);

			} else {
				throw new Exception("Unknown request: "+path);
			}
		} catch(Exception e) {
			logger.info("Error in Contribution Servlet",e);
			sendErrorResponse(response, e);
		}
	}
	
	protected void performDelete(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] ids = request.getParameterValues("id");
		String[] placeIds = request.getParameterValues("placeId");
		
		if( null == ids || ids.length < 1 ) {
			throw new Exception("Parameter 'id' not provided");
		}
		if( ids.length > 1 ) {
			throw new Exception("Parameter 'id' provided multiple times");
		}
		
		if( null == placeIds ) {
			placeIds = new String[0];
		}
		if( placeIds.length > 1 ) {
			throw new Exception("Parameter 'place_id' provided multiple times");
		}
		
		contributions.deleteContribution(ids[0], (placeIds.length > 0 ? placeIds[0] : null));
		
		JSONObject result = new JSONObject();
		result.put("id", ids[0]);
		if( placeIds.length > 0 ) {
			result.put("place_id", placeIds[0]);
		}
		sendJsonResponse(response, result);
	}
	
	protected void performFromName(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String[] names = request.getParameterValues("name");
		
		if( null == names || names.length < 1 ) {
			throw new Exception("Parameter 'name' not provided");
		}
		if( names.length > 1 ) {
			throw new Exception("Parameter 'name' provided multiple times");
		}
		
		if (null != contributions) {
			JSONObject result = contributions.fromName(names[0], userRepository);
			sendJsonResponse(response, result);
		} else {
			throw new Exception("Contribution record access requests can not be fulfill because of failed initialization - look for earlier exceptions.");
		}
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
			throw new ServletException("Failure generating an error",e);
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
