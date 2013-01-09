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
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.sql.Timestamp;

import ca.carleton.gcrc.contributions.Contributions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ContributionHandler {
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private Map<String, List<String>> parameters;
	private Principal userPrincipal;

	public ContributionHandler(
			Map<String, List<String>> parameters,
			Principal userPrincipal) {

		this.parameters = parameters;
		this.userPrincipal = userPrincipal;
	}
	
	private void addParm(String key, String value) {
		List<String> paramList = parameters.get(key);
		if (null == paramList) {
			paramList = new Vector<String>();
			parameters.put(key, paramList);
		}
		paramList.add(value);
	}

	private void createServerGeneratedFields(UploadedFileInfo fileInfo, Contributions cont, boolean fileDelete) throws Exception {
		if (!fileDelete && null == fileInfo) {
			// not asking to delete the file and no new file upload - remove parameters if they exist
			parameters.remove("filename");
			parameters.remove("original_filename");
			parameters.remove("mimetype");
			parameters.remove("file_size");
		} else if (null != fileInfo) {
			// new file info
			addParm("filename", fileInfo.getConvertedFile().getName());
			addParm("original_filename", fileInfo.getUploadedFile().getName());
			addParm("mimetype", fileInfo.getMimeType());
			addParm("file_size", "" + fileInfo.getConvertedFile().length());
		} else if (fileDelete) {
			// file to delete - explicitly insert nulls into the db
			addParm("filename", null);
			addParm("original_filename", null);
			addParm("mimetype", null);
			addParm("file_size", null);
		}

		List<String> vec = parameters.get("isUpdate");
		if (vec == null) {
			throw new Exception("Missing isUpdate parameter");
		}
		
		long now = new Date().getTime();
		if ("false".equalsIgnoreCase(vec.get(0))) {
			// create_ms and create_ts
			addParm("create_ms", "" + now);
			addParm("create_ts", "" + (new Timestamp(now)));
			
			// contributor_id
			if (null != userPrincipal) {
				int contributorId = Integer.parseInt(userPrincipal.getName());
				addParm("contributor_id", "" + contributorId);
			}
		} else {
			// create last_edit fields
			parameters.remove("last_edit_timestamp");
			parameters.remove("last_edit_id");
			addParm("last_edit_timestamp", "" + (new Timestamp(now)));
			if (null != userPrincipal) {
				int contributorId = Integer.parseInt(userPrincipal.getName());
				addParm("last_edit_id", "" + contributorId);				
			}
		}

	}
	
	public void performDatabaseUpdate(UploadedFileInfo fileInfo, Contributions cont) throws Exception {
		List<String> vec = parameters.get("id");
		if (null == vec) {
			throw new Exception("Contributor id required for update.");
		}
		logger.info("Updating contribution ("+ vec.get(0) +") for user id: "+(userPrincipal==null?"unknown":userPrincipal.getName()));
		
		boolean fileDelete = false;
		vec = parameters.get("deleteFile");
		if (null != vec && "true".equalsIgnoreCase(vec.get(0))) {
			fileDelete = true;
		}
		createServerGeneratedFields(fileInfo, cont, fileDelete);
		cont.update(parameters);
	}
	
	public void performDatabaseUpdate(Contributions cont) throws Exception {
		performDatabaseUpdate(null, cont);
	}
	
	public void performDatabaseInsert(UploadedFileInfo fileInfo, Contributions cont) throws Exception {
		logger.info("Inserting contribution for user id: "+(userPrincipal==null?"unknown":userPrincipal.getName()));
		createServerGeneratedFields(fileInfo, cont, false);
		cont.insert(parameters);
	}
	
	public void performDatabaseInsert(Contributions cont) throws Exception {
		performDatabaseInsert(null, cont);
	}	
}
