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
package ca.carleton.gcrc.upload;

import org.apache.commons.fileupload.ProgressListener;
import org.apache.log4j.Logger;

import ca.carleton.gcrc.progress.ProgressTracker;

public class UploadProgressListener implements ProgressListener {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private ProgressTracker progressTracker;
	private String progressId;
	private String fileName;
	private boolean activityCreated = false;
	
	public UploadProgressListener(ProgressTracker progressTracker) {
		this.progressTracker = progressTracker;
	}
	
	synchronized public void update(long bytesRead, long contentLength, int itemIndex) {
		logger.debug("bytesRead: "+bytesRead+" contentLength: "+contentLength+" itemIndex: "+itemIndex);
		
		if( null != progressId ) {
			if( false == activityCreated ) {
				progressTracker.initProgress(progressId, fileName, contentLength);
				activityCreated = true;
			}
			
			progressTracker.updateProgress(progressId, bytesRead);
		}
	}

	synchronized public String getProgressId() {
		return progressId;
	}

	synchronized public void setProgressId(String progressId) {
		this.progressId = progressId;
	}

	public synchronized String getFileName() {
		return fileName;
	}

	public synchronized void setFileName(String fileName) {
		this.fileName = fileName;
		
		// Update name on next pass
		activityCreated = false;
	}

}
