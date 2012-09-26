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

import java.io.File;
import java.io.InputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SystemFile {

	static private Pattern endWithSemiPattern = Pattern.compile("^(.*);$");
	static private Pattern mp3IdentifierPattern = Pattern.compile("MPEG ADTS");

	static private String runSystemCommand(String command) throws Exception {
		String line = null;
		String error = null;
		try {
			Runtime rt = Runtime.getRuntime();
			Process p = rt.exec( command );
			StringBuffer sb = new StringBuffer();
			InputStream is = p.getInputStream();
			int b = is.read();
			while( b >= 0 ) {
				if( b != 0 ) {
					sb.appendCodePoint(b);
				}
				b = is.read();
			}
			is.close();
			p.waitFor();
			line = sb.toString();
			
			if( 0 != p.exitValue() ) {
				error = line;
				line = null;
			}
		} catch (Exception e) {
			throw new Exception("Error while executing 'file' command: "+command, e);
		}
		
		if( null != error ) {
			throw new Exception("'file' process returned error: "+error+" (command: "+command+")");
		}
		
		return line;
	}
	
	static public SystemFile getSystemFile(File file) throws Exception {
		SystemFile result = new SystemFile();
		result.file = file;

		String line = null;
		try {
			line = runSystemCommand("file -bnr --mime "+file.getAbsolutePath());
		} catch (Exception e) {
			throw new Exception("Error while executing 'file' process", e);
		}
		
		// Parse line
		String[] components = line.split("\\s+");
		
		if( components.length > 0 ) {
			result.mimeType = cleanName(components[0]);
		}
		if( components.length > 1 ) {
			result.mimeEncoding = cleanName(components[1]);
		}
		
		// Fixes for unknown types
		if( "application/octet-stream".equals(result.mimeType) ) {
			String fullReport = runSystemCommand("file "+file.getAbsolutePath());
			
			Matcher mp3IdentifierMatcher = mp3IdentifierPattern.matcher(fullReport);
			
			if( mp3IdentifierMatcher.find() ) {
				result.mimeType = "audio/mp3";
			}
		}
		
		return result;
	}
	
	static private String cleanName(String inName) {
		inName = inName.trim();
		
		Matcher endWithSemiMatcher = endWithSemiPattern.matcher(inName);
		if( endWithSemiMatcher.matches() ) {
			inName = endWithSemiMatcher.group(1);
		}
		
		return inName;
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
}
