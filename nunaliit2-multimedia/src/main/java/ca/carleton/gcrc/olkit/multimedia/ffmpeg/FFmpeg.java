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
package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;

public class FFmpeg {

	static final protected Logger logger = LoggerFactory.getLogger(FFmpeg.class);
	
	static private Pattern patternVersionLine = Pattern.compile("(avconv|ffmpeg)( version)?\\s+([^,]*)",Pattern.CASE_INSENSITIVE);
	static private Pattern patternVersion = Pattern.compile("(\\d+)\\.(\\d+).*");
	
	static public String ffmpegVersionCommand = "avconv -version";
	
	static private FFmpegInfo availability;
	synchronized static public FFmpegInfo getInfo() {
		if( null == availability ) {
			FFmpegInfo avail = new FFmpegInfo();
			avail.isAvailable = false;
			
			Runtime rt = Runtime.getRuntime();
			try {
				logger.debug(ffmpegVersionCommand);
				Process p = rt.exec(ffmpegVersionCommand, null, null);
				InputStream is = p.getInputStream();
				InputStreamReader isr = new InputStreamReader(is);
				BufferedReader bufReader = new BufferedReader(isr);
				String line = bufReader.readLine();
				
				while( null != line ) {
					Matcher versionLineMatcher = patternVersionLine.matcher(line);
					if( versionLineMatcher.matches() ) {
						avail.versionLine = line;
						avail.fullVersion = versionLineMatcher.group(3);
						logger.info("FFmpeg full version: "+avail.fullVersion);
						if( avail.fullVersion.startsWith("SVN-r0.5.1") ) {
							// Handle special version of FFmpeg compiled for older atlases
							avail.majorVersion = 0;
							avail.minorVersion = 5;
							avail.isAvailable = true;
						} else {
							// Parse version
							Matcher versionMatcher = patternVersion.matcher(avail.fullVersion);
							if( versionMatcher.matches() ) {
								avail.majorVersion = Integer.parseInt(versionMatcher.group(1));
								avail.minorVersion = Integer.parseInt(versionMatcher.group(2));
								avail.isAvailable = true;
	
							} else {
								// Fall back
								avail.majorVersion = 0;
								avail.minorVersion = 0;
								avail.isAvailable = true;
							}
						}
						
						break;
					}

					// Read next line
					line = bufReader.readLine();
				}
			} catch (IOException e) {
				avail.isAvailable = false;
				logger.error("Problem while trying to reach FFmpeg",e);
			}

			availability = avail;
			if( !availability.isAvailable ) {
				logger.info("FFmpeg is not available");
			}
		}
		return availability;
	}
	
	static public FFmpegProcessor getProcessor(MultimediaConversionProgress progressTracker) {
		FFmpegInfo ffmpegInfo = getInfo();
		
		if( false == ffmpegInfo.isAvailable ) {
			return null;
//		} else if( ffmpegInfo.fullVersion.startsWith("SVN-r0.5.1") ) {
//			// Handle special version of FFmpeg compiled for older atlases
//			return new FFmpegProcessor_0_5_1(progressTracker);
		} else {
			return new FFmpegProcessorDefault(progressTracker);
		}
	}
	
	// hide
	private FFmpeg() {
		
	}
}
