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
package ca.carleton.gcrc.olkit.multimedia.imageMagick;

import java.io.BufferedReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.olkit.multimedia.utils.SystemProcess;

public class ImageMagick {

	static final protected Logger logger = Logger.getLogger(ImageMagick.class);

	static private Pattern patternVersion = Pattern.compile("^Version: ImageMagick (\\d+)\\.(\\d+).*");
	
	static private ImageMagickInfo availability;
	synchronized static public ImageMagickInfo getInfo() {
		if( null == availability ) {
			ImageMagickInfo avail = new ImageMagickInfo();
			
			avail.isAvailable = true;
			
			// Identify
			try {
				SystemProcess sp = new SystemProcess("identify -version");
				sp.start();
				BufferedReader bufReader = sp.getInputReader();
				String line = bufReader.readLine();
				avail.identifyVersion = line;
				avail.isIdentifyAvailable = true;
			} catch (Exception e) {
				avail.isIdentifyAvailable = false;
				avail.isAvailable = false;
			}
			
			// Convert
			try {
				SystemProcess sp = new SystemProcess("convert -version");
				sp.start();
				BufferedReader bufReader = sp.getInputReader();
				String line = bufReader.readLine();
				avail.convertVersion = line;
				avail.isConvertAvailable = true;
			} catch (Exception e) {
				avail.isConvertAvailable = false;
				avail.isAvailable = false;
			}
			
			availability = avail;
			
			boolean processorDetermined = false;
			int versionMajor = 0;
			int versionMinor = 0;
			if( null != avail.identifyVersion ) {
				Matcher matcher = patternVersion.matcher(avail.identifyVersion);
				if( matcher.matches() ) {
					versionMajor = Integer.parseInt( matcher.group(1) );
					versionMinor = Integer.parseInt( matcher.group(2) );
					processorDetermined = true;
				}
			}
			if( null != avail.convertVersion ) {
				Matcher matcher = patternVersion.matcher(avail.convertVersion);
				if( matcher.matches() ) {
					versionMajor = Integer.parseInt( matcher.group(1) );
					versionMinor = Integer.parseInt( matcher.group(2) );
					processorDetermined = true;
				}
			}
			if( processorDetermined ) {
				if( versionMajor < 6
				 || (versionMajor == 6 && versionMinor < 6) ) {
					avail.processorType = ImageMagickInfo.ProcessorType.VERSION_6_5_AND_PREVIOUS;
				} else {
					avail.processorType = ImageMagickInfo.ProcessorType.VERSION_6_6;
				}
				logger.info("ImageMagick "+versionMajor+"."+versionMinor+" "+avail.processorType+" ("+avail.identifyVersion+")");
			} else {
				logger.error("ImageMagick not found. Some conversion functions will not be available. The server might be unstable as a result");
			}
		}
		
		return availability;
	}
}
