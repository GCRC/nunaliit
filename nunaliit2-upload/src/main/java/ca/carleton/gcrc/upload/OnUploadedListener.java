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

import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;

import org.json.JSONObject;

public interface OnUploadedListener {

	/**
	 * This interface is called when a file has been successfully uploaded.
	 * @param progressId Progress identifier used to track the file upload via the ProgressTracker.
	 *                   null if none were specified.
	 * @param originalFileName File name selected by user when uploading the file.
	 * @param loadedFile The actual file on disk
	 * @param parameters Parameters that were sent with the upload request
	 * @param userPrincipal Authenticated user, or null
	 * @param cookies Cookies that were sent as part of the request, or null.
	 * @return JSON Object that should be sent as results.
	 * @throws Exception 
	 */
	public JSONObject onLoad(
		String progressId
		,List<LoadedFile> uploadedFiles
		,Map<String,List<String>> parameters
		,Principal userPrincipal
		,Cookie[] cookies
		) throws Exception;
}
