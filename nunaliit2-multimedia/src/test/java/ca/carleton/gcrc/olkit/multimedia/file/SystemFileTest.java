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
import java.util.Map;
import java.util.Properties;

import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaConfiguration;
import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;

import junit.framework.TestCase;

public class SystemFileTest extends TestCase {

	public void performFile(String fileName, String expectedType) throws Exception {
		File file = TestConfiguration.getTestFile(fileName);

		SystemFile sf = SystemFile.getSystemFile(file);
		
		if( null == expectedType  ) {
			if(null != sf.getMimeType()) {
				fail("Unexpected type.  Expected: "+expectedType+"  Returned: "+sf.getMimeType());
			}
		} else if( false == expectedType.equals( sf.getMimeType() ) ) {
			fail("Unexpected type.  Expected: "+expectedType+"  Returned: "+sf.getMimeType());
		}
	}
	
	public void testMultimediaConf() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		Properties props = new Properties();
		props.setProperty("file.knownString.1", "text/mangled:MANGLED");
		props.setProperty("file.knownString.2", " video/impossible : VID Impossible ");
		
		MultimediaConfiguration.configureFromProperties(props);
		
		Map<String, String> map = SystemFile.getKnownStrings();
		
		// Check MANGLED
		{
			String value = map.get("MANGLED");
			if( false == "text/mangled".equals(value) ) {
				fail("Unexpected mime type for MANGLED: "+value);
			}
		}
		
		// Check VID Impossible
		{
			String value = map.get("VID Impossible");
			if( false == "video/impossible".equals(value) ) {
				fail("Unexpected mime type for VID Impossible: "+value);
			}
		}
	}
	
	public void testTxt() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		performFile("test.txt", "text/plain");
	}
	
	public void testMpeg() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		performFile("satellite.mp3", "audio/mpeg");
	}
	
	public void testOgg() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		performFile("steps_sound.ogg", "audio/ogg");
	}
	
	public void test3gp() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		performFile("VID_20180417_132929.3gp", "video/3gpp");
	}
}
