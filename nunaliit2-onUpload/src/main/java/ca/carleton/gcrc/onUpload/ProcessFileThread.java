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
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.contributions.Contributions;
import ca.carleton.gcrc.contributions.ContributionComet;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionRequest;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConverter;
import ca.carleton.gcrc.olkit.multimedia.converter.impl.MultimediaConverterImpl;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;
import ca.carleton.gcrc.progress.ProgressInfo;
import ca.carleton.gcrc.progress.ProgressTracker;

public class ProcessFileThread extends Thread {
	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private UploadedFileInfo fileInfo;
	private String progressId;
	private Map<String, List<String>> parameters;
	private ContributionComet cometChannel;
	private Principal userPrincipal;
	private Contributions contributions;
	private ProgressTracker progressTracker;
	private MultimediaConverter mmConverter = new MultimediaConverterImpl();

	public ProcessFileThread(
			UploadedFileInfo fileInfo
			,String parentProgressId
			,Map<String, List<String>> parameters
			,ContributionComet cometChannel
			,Principal userPrincipal
			,Contributions c
			,ProgressTracker progressTracker
			) {

		this.fileInfo = fileInfo;
		this.parameters = parameters;
		this.cometChannel = cometChannel;
		this.userPrincipal = userPrincipal;
		this.contributions = c;
		this.progressTracker = progressTracker;
		
		progressId = progressTracker.createIdentifier();
		String desc = "Process file " + fileInfo.getOriginalFilename();
		
		// Chain activity
		progressTracker.initProgress(progressId, desc, 102);
		ProgressInfo info = progressTracker.getProgress(progressId);
		if( null != parentProgressId ) {
			progressTracker.addProgressChain(parentProgressId, info);
		}
	}
	
	public String getProgressId() {
		return progressId;
	}
	
	public void run() {
		try {
			// Perform file type checking
			SystemFile sf = SystemFile.getSystemFile(fileInfo.getUploadedFile());
			fileInfo.setMimeType( sf.getMimeType() );
			fileInfo.setMimeEncoding( sf.getMimeEncoding() );
			
			// Check type
			String mimeType = sf.getMimeType();
			
			logger.info("Processing: "+fileInfo.getOriginalFilename()+" with mimeType: "+mimeType);
			
			if( null == mimeType ) {
				fileInfo.setConvertedFile( fileInfo.getUploadedFile() );
				
			} else if( mimeType.contains("video") ) {
				// For video file, convert to appropriate file type
				convertVideo();

			} else if( mimeType.contains("audio") ) {
				// For audio file, convert to appropriate file type
				convertAudio();
				
			} else if( mimeType.contains("image") ) {
				// For image file, convert to appropriate file type
				convertImage();
				
			} else {
				fileInfo.setConvertedFile( fileInfo.getUploadedFile() );
			}
			
			// Insert contribution in database
			ContributionHandler t = new ContributionHandler(parameters, userPrincipal);
			List<String> vec = parameters.get("isUpdate");
			if (null == vec) {
				throw new Exception("Required isUpdate parameter undefined.");
			}
			if ("true".equalsIgnoreCase(vec.get(0))) {
				t.performDatabaseUpdate(fileInfo, contributions);
			} else {
				t.performDatabaseInsert(fileInfo, contributions);
			}
			
			// Report end of this activity
			Map<String,String> data = new HashMap<String,String>();
			data.put("file", fileInfo.getOriginalFilename());
			data.put("mime-type", fileInfo.getMimeType());
			data.put("mime-encoding", fileInfo.getMimeEncoding());
			if( parameters.containsKey("place_id") && parameters.get("place_id").size() > 0 ) {
				data.put("place_id", parameters.get("place_id").get(0));
			}
			progressTracker.updateProgressData(progressId, data);
			progressTracker.completeProgress(progressId, null);
			
			// Send completion on comet channel
			if( null != cometChannel
			 && parameters.containsKey("place_id")
			 && parameters.get("place_id").size() > 0
			 ) {
				cometChannel.reportNewContribution(parameters.get("place_id").get(0),null);
			}
			
		} catch(Exception e) {
			e.printStackTrace();
			progressTracker.completeProgress(progressId, e.getMessage());
		}
	}
	
	private void convertVideo() throws Exception {
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile( fileInfo.getUploadedFile() );
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaProgressAdaptor(progressId,progressTracker) );

		mmConverter.convertVideo(request);
		
		fileInfo.setConvertedFile( request.getOutFile() );
	}
	
	private void convertAudio() throws Exception {
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile( fileInfo.getUploadedFile() );
		request.setProgress( new MultimediaProgressAdaptor(progressId,progressTracker) );

		mmConverter.convertAudio(request);
		
		fileInfo.setConvertedFile( request.getOutFile() );
	}
	
	private void convertImage() throws Exception {
		
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile( fileInfo.getUploadedFile() );
		request.setThumbnailRequested(true);
		request.setProgress( new MultimediaProgressAdaptor(progressId,progressTracker) );

		mmConverter.convertImage(request);
		
		fileInfo.setConvertedFile( request.getOutFile() );
	}
}
