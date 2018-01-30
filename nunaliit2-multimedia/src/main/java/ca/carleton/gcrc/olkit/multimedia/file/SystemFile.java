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
package ca.carleton.gcrc.olkit.multimedia.file;

import java.io.BufferedReader;
import java.io.File;
import java.util.List;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ca.carleton.gcrc.utils.CommandUtils;

public class SystemFile {

	static private Pattern mp3IdentifierPattern = Pattern.compile("MPEG ADTS");
	static private Pattern patternAudio = Pattern.compile("audio",Pattern.CASE_INSENSITIVE);
	static private Pattern patternId3 = Pattern.compile("id3",Pattern.CASE_INSENSITIVE);

	static public SystemFile getSystemFile(File file) throws Exception {
		SystemFile result = new SystemFile();
		result.file = file;

		String line = null;
		try {
			//line = runSystemCommand(new String[]{"file","-bnr","--mime",file.getAbsolutePath()});
			List<String> tokens = new Vector<String>();
			tokens.add("file");
			tokens.add("-bnk");
			tokens.add("--mime");
			tokens.add(file.getAbsolutePath());
			
			BufferedReader br = CommandUtils.executeCommand(tokens);
			line = br.readLine();
			
		} catch (Exception e) {
			throw new Exception("Error while executing 'file' process", e);
		}
		
		// Parse line
		String[] components = line.split(";");
		
		if( components.length > 0 ) {
			String[] mimeTypes = components[0].split("\\\\012- ");
			for(String mimeType : mimeTypes){
				if( null == result.mimeType ){
					result.mimeType = mimeType;
				} else if( mimeType.startsWith("video") ) {
					result.mimeType = mimeType;
				} else if( mimeType.startsWith("audio") ) {
					result.mimeType = mimeType;
				} else if( mimeType.startsWith("text") ) {
					result.mimeType = mimeType;
				}
			}
		}
		if( components.length > 1 ) {
			result.mimeEncoding = components[1].trim();
		}
		
		// Fixes for unknown types
		if( "application/octet-stream".equals(result.mimeType) ) {
			List<String> tokens = new Vector<String>();
			tokens.add("file");
			tokens.add("-bnk");
			tokens.add("--mime");
			tokens.add(file.getAbsolutePath());
			
			BufferedReader br = CommandUtils.executeCommand(tokens);
			String fullReport = br.readLine();
			
			Matcher mp3IdentifierMatcher = mp3IdentifierPattern.matcher(fullReport);
			
			if( mp3IdentifierMatcher.find() ) {
				result.mimeType = "audio/mp3";
			}
		}
		if( "application/octet-stream".equals(result.mimeType) ) {
			List<String> tokens = new Vector<String>();
			tokens.add("file");
			tokens.add("-bnk");
			tokens.add(file.getAbsolutePath());
			
			BufferedReader br = CommandUtils.executeCommand(tokens);
			String fullReport = br.readLine();
			
			Matcher matcherAudio = patternAudio.matcher(fullReport);
			Matcher matcherId3 = patternId3.matcher(fullReport);
			
			// Looking for a line that looks like: Audio file with ID3 version 2.4.0\012- data
			if( matcherAudio.find() && matcherId3.find() ) {
				result.mimeType = "audio/mp3";
			}
		}
		
		return result;
	}
	
	private File file;
	private String mimeType;
	private String mimeEncoding;
	
	private SystemFile() {
		
	}

	public File getFile() {
		return file;
	}

	public String getMimeType() {
		return mimeType;
	}

	public String getMimeEncoding() {
		return mimeEncoding;
	}
	
	public String toString() {
		return ""+file+": "+mimeType+"; "+mimeEncoding;
	}
}
