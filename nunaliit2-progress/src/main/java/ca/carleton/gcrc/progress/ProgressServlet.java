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
package ca.carleton.gcrc.progress;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import org.apache.log4j.Logger;

public class ProgressServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private ProgressTracker progressTracker;
	
	public ProgressServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		progressTracker = ProgressTrackerSingleton.getSingleton();
	}

	public void destroy() {
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		
		logger.info("ProgressServlet "+path);

		try {
			if( "getIds".equalsIgnoreCase(path) ) {
				int count = 1;
				String countString = request.getParameter("count");
				if( null != countString ) {
					count = Integer.parseInt(countString);
				}
				if( count < 1 ) {
					count = 1;
				}
				if( count > 20 ) {
					count = 20;
				}
				
				JSONObject obj = new JSONObject();
	
				JSONArray array = new JSONArray();
				for(int loop=0; loop<count; ++loop) {
					array.put( progressTracker.createIdentifier() );
				}
				obj.put("progressIds", array);
				
				sendJsonResponse(obj, response);
				
			} else if( "getId".equalsIgnoreCase(path) ) {
				JSONObject obj = new JSONObject();
				obj.put("progressId", progressTracker.createIdentifier());
				
				sendJsonResponse(obj, response);
	
			} else if( "getProgress".equalsIgnoreCase(path) ) {
				String progressId = request.getParameter("progressId");
				if( null == progressId ) {
					response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,"progressId must be specified");
					return;
				}
	
				ProgressInfo info = progressTracker.getProgress(progressId);
				
				JSONObject obj = progressInfoToJson(info);
				
				sendJsonResponse(obj, response);
	
			} else if( "getProgresses".equalsIgnoreCase(path) ) {
				String[] progressIds = request.getParameterValues("progressId");
				if( progressIds.length < 1 ) {
					response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,"progressId must be specified");
					return;
				}
	
				JSONObject result = new JSONObject();
				JSONArray array = new JSONArray();
				
				for(int loop=0; loop<progressIds.length; ++loop) {
					String progressId = progressIds[loop];
					
					ProgressInfo info = progressTracker.getProgress(progressId);
					
					JSONObject obj = progressInfoToJson(info);
					
					array.put(obj);
				}
	
				result.put("results", array);
				sendJsonResponse(result, response);
				
			} else {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Unknown request");
			}
		} catch(Exception e) {
			throw new ServletException("Error handling progress post request",e);
		}
	}

	private JSONObject progressInfoToJson(ProgressInfo info) throws Exception {
		JSONObject obj = new JSONObject();
		
		synchronized(info) {
			obj.put("id", info.getIdentifier());
			obj.put("description", info.getDescription());
			obj.put("current", info.getCurrentCount());
			obj.put("total", info.getTotalCount());
			obj.put("completed", info.isCompleted());
			obj.put("error", info.getErrorMessage());
			
			Map<String,String> data = info.getData();
			if( null != info.getData() ) {
				JSONObject dataObj = new JSONObject();
				obj.put("data", dataObj);
				
				Iterator<String> itKey = data.keySet().iterator();
				while( itKey.hasNext() ) {
					String key = itKey.next();
					String value = data.get(key);
					dataObj.put(key, value);
				}
			}
			
			List<ProgressInfo> chainedActivities = info.getChainedActivities();
			if( chainedActivities.size() > 0 ) {
				JSONArray chain = new JSONArray();
				obj.put("chained", chain);
				
				Iterator<ProgressInfo> itChainedActivity = chainedActivities.iterator();
				while( itChainedActivity.hasNext() ) {
					ProgressInfo chainedActivity = itChainedActivity.next();
					
					JSONObject chainedObj = new JSONObject();
					chainedObj.put("id", chainedActivity.getIdentifier());
					chainedObj.put("description", chainedActivity.getDescription());
					
					chain.put(chainedObj);
				}
			}
		}
		
		return obj;
	}
	
	private void sendJsonResponse(JSONObject jsonObj, HttpServletResponse response) throws Exception {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/plain");
		response.setHeader("Cache-Control", "no-cache,must-revalidate");
		response.setDateHeader("Expires", (new Date()).getTime());
		
		OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
		jsonObj.write(osw);
		osw.flush();
	}

}
