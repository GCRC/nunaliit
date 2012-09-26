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
package ca.carleton.gcrc.onUpload;

import java.security.Principal;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;

import org.json.JSONObject;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.contributions.ContributionComet;
import ca.carleton.gcrc.contributions.ContributionCometImpl;
import ca.carleton.gcrc.contributions.ContributionCometNull;
import ca.carleton.gcrc.contributions.Contributions;
import ca.carleton.gcrc.progress.ProgressTracker;
import ca.carleton.gcrc.progress.ProgressTrackerSingleton;
import ca.carleton.gcrc.upload.LoadedFile;
import ca.carleton.gcrc.upload.OnUploadedListener;

public class OnUpload implements OnUploadedListener {
	
	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private ContributionComet cometChannel = new ContributionCometNull();
	private Contributions contributions;
	private ProgressTracker progressTracker;

	public OnUpload() {
		progressTracker = ProgressTrackerSingleton.getSingleton();
	}

	public OnUpload(ServletContext servletContext) throws ServletException {
		progressTracker = ProgressTrackerSingleton.getSingleton();
		this.cometChannel = new ContributionCometImpl(servletContext);
	}
	
	public Contributions getContributions() {
		return contributions;
	}

	public void setContributions(Contributions contributions) {
		this.contributions = contributions;
	}

	public JSONObject onLoad(
			String progressId
			,List<LoadedFile> uploadedFiles
			,Map<String, List<String>> parameters
			,Principal userPrincipal
			,Cookie[] cookies
			) throws Exception {
		
		JSONObject results = new JSONObject();

		if( uploadedFiles.size() > 0 ) {
			JSONObject uploadedObj = new JSONObject();
			results.put("uploaded", uploadedObj);
			
			Iterator<LoadedFile> itLoadedFile = uploadedFiles.iterator();
			while( itLoadedFile.hasNext() ) {
				LoadedFile loadedFile = itLoadedFile.next();
				
				logger.info("Loaded file "+loadedFile.getOriginalFileName()+ " to "+loadedFile.getFile().getName());
	
				// Create thread to determine file type
				UploadedFileInfo fileInfo = new UploadedFileInfo();
				fileInfo.setOriginalFilename( loadedFile.getOriginalFileName() );
				fileInfo.setUploadedFile( loadedFile.getFile() );
				ProcessFileThread t = new ProcessFileThread(fileInfo, progressId, parameters, cometChannel, userPrincipal, contributions, progressTracker);
				t.start();

				// Add entry to results
				JSONObject fileObj = new JSONObject();
				fileObj.put("chained", t.getProgressId());
				uploadedObj.put(loadedFile.getFile().getName(),fileObj);
			}
		} else {
			// insert contributions record into database immediately
			ContributionHandler t = new ContributionHandler(parameters, userPrincipal);
			List<String> vec = parameters.get("isUpdate");
			if (null == vec) {
				throw new Exception("Required isUpdate parameter undefined.");
			}
			if ("true".equalsIgnoreCase(vec.get(0))) {
				t.performDatabaseUpdate(contributions);
			} else {
				t.performDatabaseInsert(contributions);
			}
			
			// This submission is complete. Report place_id
			if( null != progressId
			 && parameters.containsKey("place_id")
			 && parameters.get("place_id").size() > 0
			 ) {
				HashMap<String,String> map = new HashMap<String,String>();
				map.put("place_id", parameters.get("place_id").get(0));
				progressTracker.updateProgressData(progressId, map);
			}
			
			// This submission is complete. Report place_id
			if( parameters.containsKey("place_id")
			 && parameters.get("place_id").size() > 0
			 ) {
				cometChannel.reportNewContribution(parameters.get("place_id").get(0),null);
			}
		}
		
		return results;
	}

}
