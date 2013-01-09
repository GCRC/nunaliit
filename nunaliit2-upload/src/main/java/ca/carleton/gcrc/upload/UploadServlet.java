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

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadBase.FileSizeLimitExceededException;
import org.apache.commons.fileupload.FileUploadBase.SizeLimitExceededException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.FileCleanerCleanup;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;
import org.apache.commons.io.FileCleaningTracker;
import org.apache.commons.io.FilenameUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.progress.ProgressTracker;
import ca.carleton.gcrc.progress.ProgressTrackerSingleton;

public class UploadServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	public static final String OnUploadedListenerAttributeName = "ON UPLOADED LISTENER";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	static final int DEFAULT_MAX_MEMORY_SIZE = 10 * 1024; // 10KB
	static final long DEFAULT_MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
	
	private int maxMemorySize = DEFAULT_MAX_MEMORY_SIZE;
	private long maxUploadSize = DEFAULT_MAX_UPLOAD_SIZE;
	private File fileItemTempDir = null;
	private DiskFileItemFactory fileItemfactory = null;
	private File repositoryDir = null;
	private ProgressTracker progressTracker = null;

	private OnUploadedListener onUploadedListener = null;
	
	public UploadServlet() {
		
	}

	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		// Figure out root file
		File rootFile = null;
		{
			if( null != config ) {
				if( null != config.getServletContext() ) {
					String realRoot = config.getServletContext().getRealPath(".");
					if( null != realRoot ) {
						rootFile = new File(realRoot);
					}
				}
			}
		}
		
		// Load up configuration information
		Properties props = UploadUtils.getProperties(config.getServletContext());
		for(Entry<Object,Object> entry : props.entrySet()){
			Object keyObj = entry.getKey();
			Object valueObj = entry.getValue();
			logger.info("Upload Property "+keyObj+" = "+valueObj);
		}

		// Repository directory (this is where files are sent to)
		repositoryDir = UploadUtils.getMediaDir(config.getServletContext());

		// Temp directory
		String tempDirName = props.getProperty("tempDir");
		if( null != tempDirName ) {
			fileItemTempDir = new File(tempDirName);
			if( false == fileItemTempDir.isAbsolute() ) {
				fileItemTempDir = new File(rootFile, fileItemTempDir.getPath());
			}
			logger.info("Temp directory is "+fileItemTempDir.getAbsolutePath());
		}

		// Max upload file size
		String maxSizeString = props.getProperty("upload.maxSize");
		if( null != maxSizeString ) {
			long maxSize = Long.parseLong(maxSizeString);
			this.setMaxUploadSize(maxSize);
			logger.info("Max upload size is "+maxSize);
		}

		// Load up follow-on task for file upload
		onUploadedListener = (OnUploadedListener)config.getServletContext().getAttribute(OnUploadedListenerAttributeName);
		if( null == onUploadedListener ) {
			onUploadedListener = OnUploadedListenerSingleton.getSingleton();
		}
		if( null == onUploadedListener ) {
			logger.info("OnUploadedListener is not provided");
		} else {
			logger.info("OnUploadedListener: "+onUploadedListener.getClass().getSimpleName());
		}

		fileItemfactory = new DiskFileItemFactory();
		fileItemfactory.setSizeThreshold(maxMemorySize);
		if( null != fileItemTempDir ) {
			fileItemfactory.setRepository(fileItemTempDir);
		}
		
		progressTracker = ProgressTrackerSingleton.getSingleton();
	}

	public void destroy() {
		FileCleaningTracker cleaner = FileCleanerCleanup.getFileCleaningTracker(this.getServletContext());
		if( null != cleaner ) {
			cleaner.exitWhenFinished();
		}
	}

	public synchronized int getMaxMemorySize() {
		return maxMemorySize;
	}

	public synchronized void setMaxMemorySize(int maxMemorySize) {
		this.maxMemorySize = maxMemorySize;
	}

	public synchronized long getMaxUploadSize() {
		return maxUploadSize;
	}

	public synchronized void setMaxUploadSize(long maxUploadSize) {
		this.maxUploadSize = maxUploadSize;
	}
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		
		logger.info("UploadServlet >"+path+"<");

		if( "put".equalsIgnoreCase(path) ) {
			doFileUpload(request, response);
			
		} else if( "welcome".equalsIgnoreCase(path) ) {
			doWelcome(request, response);
				
		} else {
			response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Unknown request");
		}
	}

	private void doFileUpload(HttpServletRequest request, HttpServletResponse response) throws IOException {
		String progressId = null;
		List<LoadedFile> loadedFiles = new Vector<LoadedFile>();
		Map<String,List<String>> parameterMap = new HashMap<String,List<String>>();
		
		try {
			// Check that we have a file upload request
			boolean isMultipart = ServletFileUpload.isMultipartContent(request);
			
			if ( false == isMultipart ) {
				throw new Exception("File upload must be a multi-part request");
			}
			
			UploadProgressListener listener = new UploadProgressListener(progressTracker);
			
			ServletFileUpload upload = new ServletFileUpload(fileItemfactory);
			upload.setSizeMax(maxUploadSize);
			upload.setProgressListener(listener);
			
			FileItemIterator iter = upload.getItemIterator(request);
			while (iter.hasNext()) {
			    FileItemStream item = iter.next();
			    String name = item.getFieldName();
			    InputStream stream = item.openStream();
			    if (item.isFormField()) {
			    	String value = Streams.asString(stream);

			    	logger.info("Upload "+name+":"+value); 
			    	
			    	if( "progressId".equals(name) ) {
			    		progressId = value;
			    		listener.setProgressId(value);
			    	} else {
				    	// Add parameter to map
				    	List<String> paramList = parameterMap.get(name);
				    	if( null == paramList ) {
				    		paramList = new Vector<String>();
				    		parameterMap.put(name,paramList);
				    	}
				    	paramList.add(value);
			    	}
			    	
			    } else {
			    	
			    	LoadedFileImpl loadedFile = new LoadedFileImpl();
			    	loadedFile.setParameterName(name);

			    	// Get original filename
			    	String fileName = item.getName();
			        if (fileName != null) {
			        	fileName = fileName.trim();
			        	if( 0 == fileName.length() ) {
			        		fileName = null;
			        	} else {
			        		fileName = FilenameUtils.getName(fileName);
			        	}
			        }
			        
			        if( fileName != null ) {
				        loadedFile.setOriginalFileName(fileName);
	
				        listener.setFileName(fileName);
	
				    	logger.info("Upload file is "+fileName); 
	
				    	// Figure out suffix
				    	String suffix = "";
				    	if( null != fileName ){
				    		String parts[] = fileName.split("\\.");
				    		if( parts.length > 1 ) {
				    			suffix = "."+parts[ parts.length-1 ];
				    		}
				    	}
				    	
				    	// Create a name for this file
				    	File target = File.createTempFile("upl", suffix, repositoryDir);
				    	loadedFile.setFile(target);
				    	
				    	FileOutputStream fos = null;
						try {
							fos = new FileOutputStream(target);
							int b = stream.read();
							while( b >= 0) {
								fos.write(b);
								b = stream.read();
							}
						} catch (Exception e) {
							throw new Exception("Error while writing file "+target.getAbsolutePath());
						} finally {
							if( null != fos ) {
								try {
									fos.close();
								} catch (Exception e) {
									// Ignore
								}
							}
						}
				   
						loadedFiles.add(loadedFile);
				        logger.info("File written to "+target.getAbsolutePath());
			        }
			    }
			}
			
			// Run onLoad task
			JSONObject onLoadResults = null;
			if( null != onUploadedListener ) {
				onLoadResults = onUploadedListener.onLoad(
						progressId
						,loadedFiles
						,parameterMap
						,request.getUserPrincipal()
						,request.getCookies()
						);
			}
			
			// Mark that the progress on this is completed
			if( null != progressId ) {
				progressTracker.completeProgress(progressId, null);
			}
			
			// Return JSON object to acknowledge the upload
			{
				JSONObject obj = new JSONObject();
				
				if( null != progressId ) {
					obj.put("progressId", progressId);
				}
				
				if( loadedFiles.size() > 0 ) {
					JSONArray uploadedArray = new JSONArray();
					obj.put("uploaded", uploadedArray);
					
					Iterator<LoadedFile> itLoadedFile = loadedFiles.iterator();
					while( itLoadedFile.hasNext() ) {
						LoadedFile loadedFile = itLoadedFile.next();
						
						JSONObject fileObj = new JSONObject();
						fileObj.put("original", loadedFile.getOriginalFileName());
						fileObj.put("target", loadedFile.getFile().getName());
						
						uploadedArray.put(fileObj);
					}
				}
				
				// OnLoad results
				if( null != onLoadResults ) {
					obj.put("onLoadResults", onLoadResults);
				}
				
				response.setCharacterEncoding("utf-8");
				response.setContentType("text/plain");
				response.setHeader("Cache-Control", "no-cache,must-revalidate");
				response.setDateHeader("Expires", (new Date()).getTime());
				
				OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
				obj.write(osw);
				osw.flush();
			}
		} catch (SizeLimitExceededException e) {
			reportError(response, HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE, e, loadedFiles, progressId);
		} catch (FileSizeLimitExceededException e) {
			reportError(response, HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE, e, loadedFiles, progressId);
		} catch (Exception e) {
			reportError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e, loadedFiles, progressId);
		}
	}

	private void doWelcome(HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			// Return JSON object to acknowledge the welcome
			{
				JSONObject obj = new JSONObject();
				obj.put("ok", true);
				obj.put("message", "upload service");
				obj.put("maxSize", maxUploadSize);
				
				response.setCharacterEncoding("utf-8");
				response.setContentType("text/plain");
				response.setHeader("Cache-Control", "must-revalidate,no-cache,no-store");
				response.setDateHeader("Expires", (new Date()).getTime());
				
				OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
				obj.write(osw);
				osw.flush();
			}
		} catch (Exception e) {
			reportError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e, null, null);
		}
	}
	
	private void reportError(HttpServletResponse response, int code, Throwable error, List<LoadedFile> loadedFiles, String progressId) throws IOException {
		// Figure out which file it choked on
		String fileName = "<unknown>";
		if( null != loadedFiles && loadedFiles.size() > 0 ) {
			fileName = loadedFiles.get(loadedFiles.size()-1).getOriginalFileName();
		}
		
		logger.info("Error loading file "+fileName,error);
		
		// Mark that the progress on this is completed
		if( null != progressId ) {
			progressTracker.completeProgress(progressId, error.getMessage());
		}
		
//		if( null != error ) {
//			response.sendError(code, error.getMessage());
//		} else {
//			response.sendError(code);
//		}

		// Create error string
		String errorString = "{\"error\":\"Unable to generate error message\"}";
		try {
			JSONObject obj = new JSONObject();
			obj.put("error", error.getMessage());
			
			StringWriter sw = new StringWriter();
			obj.write(sw);
			errorString = sw.toString();
		} catch(Exception e) {
			// Ignore
		}
		
		// Return JSON object to acknowledge the welcome
		{	
			response.setStatus(code);
			response.setCharacterEncoding("utf-8");
			response.setContentType("application/json");
			response.setHeader("Cache-Control", "must-revalidate,no-cache,no-store");
			response.setDateHeader("Expires", (new Date()).getTime());
			
			OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
			osw.write(errorString);
			osw.flush();
		}
	}
}