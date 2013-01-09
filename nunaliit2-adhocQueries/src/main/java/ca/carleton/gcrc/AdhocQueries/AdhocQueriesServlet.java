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
package ca.carleton.gcrc.AdhocQueries;

import ca.carleton.gcrc.AdhocQueriesImpl.AdhocQuerySpecImpl;

import ca.carleton.gcrc.dbSec.ColumnData;
import ca.carleton.gcrc.dbSec.impl.ColumnDataUtils;
import ca.carleton.gcrc.jdbc.JdbcConnections;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Date;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AdhocQueriesServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private JdbcConnections connections = null;
	Connection connection = null;
	AdhocQueries queries = null;
	
	public AdhocQueriesServlet() {
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);

		try {
			connections = JdbcConnections.connectionsFromServletContext(config.getServletContext());
			connection = connections.getDb();
		} catch (Exception e) {
			throw new ServletException("Error while connecting to database",e);
		}
		queries = new AdhocQueries(connection);
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
			if ("query".equalsIgnoreCase(path)) {
				performQuery(request, response);

			} else {
				throw new Exception("Unknown request: "+path);
			}
		} catch(Exception e) {
			sendErrorResponse(response, e);
			logger.error("Error while performing search",e);
		}
	}
	
	protected void performQuery(HttpServletRequest request, HttpServletResponse response) throws Exception {
		// Retrieve id, if available
		String queryId = null;
		{
			String[] stringIds = request.getParameterValues("id");
			if( null != stringIds ) {
				if( stringIds.length > 1 ) {
					throw new Exception("Parameter 'id' provided multiple times");
				}
				if( stringIds.length == 1 ) {
					queryId = stringIds[0];
				}
			}
		}
		
		// Retrieve label, if available
		String queryLabel = null;
		{
			String[] labels = request.getParameterValues("label");
			if( null != labels ) {
				if (labels.length > 1) {
					throw new Exception("Parameter 'label' provided multiple times");
				}
				if( labels.length == 1 ) {
					queryLabel = labels[0];
				}
			}
		}
		
		// Verify that exactly one of id or label is provided
		{
			int count = 0;
			if( null != queryId ) {
				++count;
			}
			if( null != queryLabel ) {
				++count;
			}
			if( 1 != count ) {
				throw new Exception("Exactly one of 'id' or 'label' must be provided.");
			}
		}
		
		// Process parameters
		String[] args = request.getParameterValues("args");
		if (null == args || args.length < 1) {
			args = new String[] { "" }; // empty comma-separated list of args
		} else if (args.length > 1) {
			throw new Exception("Parameter 'args' provided multiple times");
		}
		
		// Retrieve adhocQuery spec
		AdhocQuerySpec spec = null;
		if( null != queryId ) {
			spec = getQuerySpecFromId( queryId );
			
		} else if( null != queryLabel ) {
			spec = getQuerySpecFromLabel( queryLabel );
			
		} else {
			// Should never happen
			throw new Exception("Can not retrieve adhocQuery. Method is broken.");
		}
		logger.info("Using adhocQuery id: "+spec.getId()+"  label: "+spec.getLabel());
		
		JSONObject result = queries.performAdhocQueryWithArgs(spec.getQueryString(), args[0], spec.getExpectedArgCount());
		
		sendJsonResponse(response, result);
	}
	
	private AdhocQuerySpec getQuerySpecFromId(String id) throws Exception {
		PreparedStatement stmt = connection.prepareStatement("SELECT id,label,stmt FROM adhoc_queries WHERE id = ?;");
				
		ColumnDataUtils.writeToPreparedStatement(stmt, 1, id, ColumnData.Type.INTEGER); // always integer arg for now

		boolean resultAvailable = stmt.execute();
		if (!resultAvailable) { // indicates an update count or no results - this must be no results
			throw new Exception("Query " + id + " not found.");
		}
		ResultSet rs = stmt.getResultSet();
		
		if (!rs.next()) { // should only be one row in response
			throw new Exception("Query " + id + " not returned (but result also not marked as empty).");
		}
			
		int responseId = rs.getInt(1);
		String responseLabel = rs.getString(2);
		String qString = rs.getString(3);
		return(new AdhocQuerySpecImpl(responseId, responseLabel, qString));
	}
	
	private AdhocQuerySpec getQuerySpecFromLabel(String label) throws Exception {
		PreparedStatement stmt = connection.prepareStatement("SELECT id,label,stmt FROM adhoc_queries WHERE label = ?;");
				
		ColumnDataUtils.writeToPreparedStatement(stmt, 1, label, ColumnData.Type.STRING); // always string label

		boolean resultAvailable = stmt.execute();
		if (!resultAvailable) { // indicates an update count or no results - this must be no results
			throw new Exception("Adhoc query associated with label '" + label + "' not found.");
		}
		ResultSet rs = stmt.getResultSet();
		
		if (!rs.next()) { // should only be one row in response
			throw new Exception("Adhoc query associated with label '" + label + "' not returned (but result also not marked as empty).");
		}
			
		int responseId = rs.getInt(1);
		String responseLabel = rs.getString(2);
		String qString = rs.getString(3);
		return(new AdhocQuerySpecImpl(responseId, responseLabel, qString));
	}

	protected void sendJsonResponse(HttpServletResponse response, JSONObject result) throws ServletException {

		response.setStatus(HttpServletResponse.SC_OK);
		response.setHeader("Cache-Control", "no-cache");
		response.setDateHeader("Expires", (new Date()).getTime());
		response.setContentType("text/plain");
		response.setCharacterEncoding("utf-8");

		try {
			OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(), "UTF-8");
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
			
			OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(), "UTF-8");
			result.write(osw);
			osw.flush();
		} catch(Exception e) {
			throw new ServletException("Failure generating error",e);
		}
	}
	
	protected JSONObject errorToJson(Throwable error) throws Exception {

		JSONObject errorObj = new JSONObject();
		errorObj.put("message", error.getMessage());
		if (null != error.getCause()) {
			errorObj.put("cause", errorToJson(error.getCause()));
		}
		return errorObj;
	}
	
}
